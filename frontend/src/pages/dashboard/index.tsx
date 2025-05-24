// import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PencilIcon } from "@/public/icons";
import mankindPharma from "@/public/images/mankind-pharma-logo.png";
const modules = [
  { id: "gxp", title: "GxP Services", description: "Manage compliance-related activities", route: "/gxp" },
  { id: "qa", title: "Quality Assurance", description: "Monitor QA processes", route: "/qa" },
  { id: "labs", title: "Lab Management", description: "Oversee lab operations", route: "/labs" },
  { id: "supply", title: "Supply Chain", description: "Track supply and inventory", route: "/supply" },
  { id: "training", title: "Training & SOPs", description: "Employee training management", route: "/training" },
  { id: "docs", title: "Document Control", description: "Secure document management", route: "/docs" },
  // Add more up to 10...
];

const Dashboard = () => {
  // const { t } = useTranslation();
  const navigate = useNavigate();

  const handleModuleClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen px-6 bg-gray-50">
      <div className="mb-10">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">Mankind Pharma</h1>
          <img src={mankindPharma} alt="Organization Logo" className=" object-cover h-50 w-20 w-auto" />
        </div>

        <div className="relative overflow-hidden w-full mt-4 h-10 border-t-2 border-b-2 border-gray-200 pt-2">
          <div className="animate-marquee whitespace-nowrap text-lg text-gray-600">
            Discover Mankind Pharma, India's 4th largest pharmaceutical company, committed to affordability, quality, and accessibility in healthcare.          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <div
            key={mod.id}
            onClick={() => handleModuleClick(mod.route)}
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
