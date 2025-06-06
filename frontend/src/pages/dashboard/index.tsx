import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PencilIcon } from "@/public/icons";
import { getCompany } from "@/services/admin.service";

const modules = [
  {
    id: "gxp",
    title: "GxP Services",
    description: "Manage compliance-related activities",
    route: "/gxp"
  },
  { id: "qa", title: "Comming soon...", description: ".......", route: "/qa" },
  {
    id: "labs",
    title: "Comming soon...",
    description: ".......",
    route: "/labs"
  },
  {
    id: "supply",
    title: "Comming soon...",
    description: ".......",
    route: "/supply"
  },
  {
    id: "training",
    title: "Comming soon... ",
    description: ".......",
    route: "/training"
  },
  {
    id: "docs",
    title: "Comming soon...",
    description: ".......",
    route: "/docs"
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [company, setCompany] = useState<{
    name: string;
    description?: string;
    logo?: string;
  } | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const { company: fetchCompany } = await getCompany();
        setCompany(fetchCompany);
      } catch (err) {
        console.error("Failed to fetch company", err);
      }
    };

    fetchCompany();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-10">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            {company?.name || "..."}
          </h1>
          {company?.logo && (
            <img
              src={`${import.meta.env.VITE_API_BASE_URL}/uploads${company.logo}`}
              alt="Organization Logo"
              className="h-32 w-44 object-contain rounded-md shadow"
            />
          )}
        </div>

        {company?.description && (
          <div className="relative overflow-hidden w-full mt-4 h-10 border-t-2 border-b-2 border-gray-200 pt-2">
            <div className="animate-marquee whitespace-nowrap text-lg text-gray-600">
              {company.description}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <div
            key={mod.id}
            onClick={() => navigate(mod.route)}
            className="cursor-pointer rounded-2xl shadow-md bg-white p-6 hover:shadow-xl transition-all border hover:border-blue-500"
          >
            <div className="flex items-center gap-4 mb-4">
              <PencilIcon className="w-8 h-8 text-blue-600" />
              <h2 className="text-xl font-semibold">{mod.title}</h2>
            </div>
            <p className="text-gray-600">{mod.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
