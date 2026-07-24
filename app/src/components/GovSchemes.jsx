import React, { useState } from "react";
import { useTranslation } from 'react-i18next'
import { FaSeedling, FaShieldAlt, FaWarehouse } from "react-icons/fa";

const schemes = [
  {
    id: 1,
    category: "Farming",
    title: "Scheme for Organic Farming",
    description: "Support for farmers transitioning to organic farming, including subsidies for organic certifications.",
    icon: <FaSeedling className="text-green-600 text-2xl" />,
  },
  {
    id: 2,
    category: "Insurance",
    title: "Subsidy for Crop Insurance",
    description: "Financial assistance for crop insurance premiums to protect against unforeseen losses.",
    icon: <FaShieldAlt className="text-blue-600 text-2xl" />,
  },
  {
    id: 3,
    category: "Infrastructure",
    title: "Infrastructure Development Grant",
    description: "Funding for building irrigation systems and storage facilities on farms.",
    icon: <FaWarehouse className="text-yellow-600 text-2xl" />,
  },
];

const categories = ["All", "Farming", "Insurance", "Infrastructure"];

export default function GovSchemes() {
  const { t } = useTranslation()
  const [activeFilter, setActiveFilter] = useState(t('all') || "All");

  const filteredSchemes =
    activeFilter === "All"
      ? schemes
      : schemes.filter((s) => s.category === activeFilter);

  return (
    <div className="bg-white min-h-screen px-6 py-8 font-sans text-gray-800">
      <h1 className="text-xl font-bold mb-4">{t('government_schemes')}</h1>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 text-sm">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-4 py-1 rounded-full border ${activeFilter === cat
                ? "bg-blue-600 text-white"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
          >
            {t(cat.toLowerCase()) || cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder={t('search_placeholder')}
        className="w-full max-w-md mb-6 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
      />

      {/* Scheme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredSchemes.map((scheme) => (
          <div
            key={scheme.id}
            className="bg-gray-50 rounded-lg shadow-sm p-4 flex flex-col justify-between"
          >
            <div className="flex items-center space-x-3">
              {scheme.icon}
              <h2 className="font-semibold text-base">{scheme.title}</h2>
            </div>
            <p className="text-sm mt-2">{scheme.description}</p>
            <button className="mt-4 text-sm font-semibold bg-black text-white px-3 py-1 rounded hover:bg-gray-800 w-fit">
              {t('apply_now')}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4 text-sm">
          <details className="bg-gray-100 p-3 rounded">
            <summary className="cursor-pointer font-medium">
              What is the eligibility criteria for subsidies?
            </summary>
            <p className="mt-2">
              Eligibility varies by scheme but generally includes criteria such as farm size, crop type, and region.
            </p>
          </details>

          <details className="bg-gray-100 p-3 rounded">
            <summary className="cursor-pointer font-medium">
              How can I apply for a scheme?
            </summary>
            <p className="mt-2">
              Applications can be submitted online through the portal under each scheme's details.
            </p>
          </details>

          <details className="bg-gray-100 p-3 rounded">
            <summary className="cursor-pointer font-medium">
              Where can I find more help?
            </summary>
            <p className="mt-2">
              For more assistance, contact our helpline service available through the Helpline Services link.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
