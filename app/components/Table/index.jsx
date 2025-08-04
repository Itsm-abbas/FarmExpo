import fonts from "@utils/fonts";
import React from "react";
import { MdDelete, MdEdit } from "react-icons/md";
import { motion } from "framer-motion";

const ReusableTable = ({
  title,
  headers,
  data,
  onDelete,
  onEdit,
  isLoading,
  addButton,
  noDataMessage = "No data found",
}) => {
  // Helper function to access nested fields
  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  };

  return (
    <div className="space-y-4">
      <div
        className={`${fonts.poppins.className} border-2 border-LightBorder dark:border-DarkBorder shadow-md rounded-md p-3 md:p-6 text-LightPText dark:text-DarkPText`}
      >
        <h2 className="text-lg sm:text-xl font-semibold mb-4 capitalize">
          {title}
        </h2>

        <div>
          <table className="w-full  min-w-max text-xs sm:text-sm md:text-base border-collapse border border-LightBorder dark:border-DarkBorder capitalize rounded-lg overflow-hidden shadow-lg">
            <thead>
              <tr className="bg-PrimaryButton text-white">
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-3 sm:px-4 py-2 border border-LightBorder dark:border-DarkBorder text-center"
                  >
                    {header.label || header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    {headers.map((_, idx) => (
                      <td
                        key={idx}
                        className="border border-LightBorder dark:border-DarkBorder px-3 sm:px-4 py-2 text-center"
                      >
                        <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-4 rounded-md"></div>
                      </td>
                    ))}
                  </motion.tr>
                ))
              ) : data?.length > 0 ? (
                data.map((item, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <td className="border border-LightBorder dark:border-DarkBorder px-3 sm:px-4 py-1 sm:py-2 text-center">
                      {index + 1}
                    </td>
                    {headers.slice(1, -1).map((field, idx) => (
                      <td
                        key={idx}
                        className="border border-LightBorder dark:border-DarkBorder px-3 sm:px-4 py-1 sm:py-2 text-center"
                      >
                        {field.accessor
                          ? getNestedValue(item, field.accessor)
                          : item[field]}
                      </td>
                    ))}
                    <td className="border border-LightBorder dark:border-DarkBorder px-3 sm:px-4 py-1 sm:py-2 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => onEdit(item.id)}
                          className="p-1 sm:p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition text-base sm:text-lg"
                        >
                          <MdEdit />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1 sm:p-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition text-base sm:text-lg"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <td
                    colSpan={headers.length}
                    className="text-center text-sm md:text-lg font-semibold px-3 sm:px-4 py-2"
                  >
                    {noDataMessage}
                  </td>
                </motion.tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {addButton}
    </div>
  );
};

export default ReusableTable;
