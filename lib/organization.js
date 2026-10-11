import { HttpError } from "@lib/session";

export const ORGANIZATION_PUBLIC_FIELDS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  ntn: true,
  website: true,
  baseCurrency: true,
  brandColor: true,
  updatedAt: true,
  logo: true,
  invoiceTemplate: true,
  letterheadType: true,
  useLetterhead: true,
  letterheadTop: true,
  letterheadBottom: true,
  invoiceNotes: true,
};

export const INVOICE_TEMPLATE_IDS = ["classic", "modern", "compact"];

// The logo and letterhead are served separately so they can be cached;
// clients get URLs versioned by updatedAt, so a new upload shows up at once.
export function serializeOrganization(org) {
  if (!org) return null;
  const { logo, letterheadType, ...rest } = org;
  const version = new Date(org.updatedAt).getTime();
  return {
    ...rest,
    logoUrl: logo ? `/api/organization/logo?v=${version}` : null,
    letterheadType: letterheadType || null,
    letterheadUrl: letterheadType
      ? `/api/organization/letterhead?v=${version}`
      : null,
  };
}

const LOGO_SIGNATURES = {
  "image/png": (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/webp": (b) =>
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP",
};
const MAX_LOGO_BYTES = 512 * 1024;

// Accepts a data URL for a PNG, JPEG or WebP image (SVG is refused because it
// can carry script) and checks the bytes really are that format.
export function parseLogo(dataUrl) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
    dataUrl || ""
  );
  if (!match) {
    throw new HttpError(400, "Logo must be a PNG, JPEG or WebP image");
  }
  const [, mime, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length > MAX_LOGO_BYTES) {
    throw new HttpError(400, "Logo must be smaller than 512 KB");
  }
  if (!LOGO_SIGNATURES[mime](bytes)) {
    throw new HttpError(400, "The logo file is not a valid image");
  }
  return { mime, bytes, dataUrl: `data:${mime};base64,${base64}` };
}

const LETTERHEAD_SIGNATURES = {
  ...LOGO_SIGNATURES,
  "application/pdf": (b) => b.toString("ascii", 0, 5) === "%PDF-",
};
const MAX_LETTERHEAD_BYTES = 3 * 1024 * 1024;

// A letterhead page as a data URL: PNG, JPEG or PDF, checked by its bytes.
export function parseLetterhead(dataUrl) {
  const match =
    /^data:(image\/(?:png|jpeg)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/.exec(
      dataUrl || ""
    );
  if (!match) {
    throw new HttpError(400, "Letterhead must be a PNG, JPEG or PDF file");
  }
  const [, mime, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length > MAX_LETTERHEAD_BYTES) {
    throw new HttpError(400, "Letterhead must be smaller than 3 MB");
  }
  if (!LETTERHEAD_SIGNATURES[mime](bytes)) {
    throw new HttpError(400, "The letterhead file is damaged or not what it claims to be");
  }
  return { mime, bytes, dataUrl: `data:${mime};base64,${base64}` };
}

function marginMm(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 120) {
    throw new HttpError(400, `${field} must be a whole number of mm between 0 and 120`);
  }
  return n;
}

function text(value, max = 200) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") throw new HttpError(400, "Invalid value");
  const trimmed = value.trim();
  if (trimmed.length > max) throw new HttpError(400, "Value is too long");
  return trimmed || null;
}

// Whitelists the editable organization fields from a request body.
export function organizationData(body) {
  const data = {
    email: text(body.email),
    phone: text(body.phone, 60),
    address: text(body.address, 400),
    ntn: text(body.ntn, 60),
    website: text(body.website),
  };

  if (body.name !== undefined) {
    const name = text(body.name, 120);
    if (!name) throw new HttpError(400, "Organization name is required");
    data.name = name;
  }
  if (body.baseCurrency !== undefined) {
    const currency = text(body.baseCurrency, 10)?.toUpperCase();
    if (!currency || !/^[A-Z]{3}$/.test(currency)) {
      throw new HttpError(400, "Currency must be a 3-letter code such as PKR");
    }
    data.baseCurrency = currency;
  }
  if (body.brandColor !== undefined) {
    const color = text(body.brandColor, 7);
    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      throw new HttpError(400, "Brand color must look like #1F6F4A");
    }
    data.brandColor = color ? color.toUpperCase() : null;
  }
  if (body.logo !== undefined) {
    data.logo = body.logo === null ? null : parseLogo(body.logo).dataUrl;
  }

  if (body.invoiceTemplate !== undefined) {
    if (!INVOICE_TEMPLATE_IDS.includes(body.invoiceTemplate)) {
      throw new HttpError(400, "Unknown invoice template");
    }
    data.invoiceTemplate = body.invoiceTemplate;
  }
  if (body.letterhead !== undefined) {
    if (body.letterhead === null) {
      data.letterhead = null;
      data.letterheadType = null;
      data.useLetterhead = false;
    } else {
      const { mime, dataUrl } = parseLetterhead(body.letterhead);
      data.letterhead = dataUrl;
      data.letterheadType = mime;
    }
  }
  if (body.useLetterhead !== undefined && data.useLetterhead === undefined) {
    data.useLetterhead = Boolean(body.useLetterhead);
  }
  if (body.letterheadTop !== undefined) {
    data.letterheadTop = marginMm(body.letterheadTop, "Top margin");
  }
  if (body.letterheadBottom !== undefined) {
    data.letterheadBottom = marginMm(body.letterheadBottom, "Bottom margin");
  }
  if (body.invoiceNotes !== undefined) {
    data.invoiceNotes = text(body.invoiceNotes, 1500);
  }

  for (const key of Object.keys(data)) {
    if (data[key] === undefined) delete data[key];
  }
  return data;
}
