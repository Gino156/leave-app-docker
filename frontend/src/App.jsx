import { useState, useEffect } from 'react';
import { 
  Card, CardBody, Divider, Button, Chip, Spinner,
  User, Skeleton, useDisclosure, CardHeader
} from "@heroui/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Local Components
import LoginPage from './components/LoginPage';
import MainNavbar from './components/MainNavbar';
import LeaveHistoryTable from './components/LeaveHistoryTable';
import RequestLeave from './components/RequestLeave';
import InformationPage from './components/InformationPage';

// Icon Component
export const PlusIcon = ({ fill = "currentColor", size = 24 }) => (
  <svg fill="none" height={size} viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke={fill} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// --- DASHBOARD VIEW COMPONENT ---
// Hiwalay na component para sa main content para malinis ang Routing sa App()
const DashboardView = ({ 
  userProfile, loading, onOpen, apiData, fetchData, leaveHistory 
}) => {
  const stats = [
    { label: "Ending balance", value: userProfile?.credits?.ending_balance ?? "0", color: "text-black" },
    { label: "Earned", value: userProfile?.credits?.earned ?? "0", color: "text-blue-600" },
    { label: "Consumed", value: userProfile?.credits?.consumed ?? "0", color: "text-red-600" },
    { label: "Available", value: userProfile?.credits?.available ?? "0", color: "text-green-600" }
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 flex flex-col gap-6 sm:gap-8">
      {/* PROFILE SECTION */}
      <section className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <User
          avatarProps={{ 
            showFallback: true, 
            size: "lg", 
            isBordered: true,
            className: "border-green-600 border-2 bg-white text-slate-400" 
          }}
          description={loading ? <Skeleton className="h-3 w-24 rounded-lg mt-1" /> : `Employee ID: ${userProfile?.EmployeeId || userProfile?.id || "N/A"}`}
          name={loading ? <Skeleton className="h-4 w-32 rounded-lg" /> : (userProfile?.full_name || "User")}
          className="transition-transform hover:scale-105 uppercase font-bold"
        />
        <Button 
          color="success" 
          variant="shadow" 
          startContent={<PlusIcon size={20} />} 
          radius="full" 
          className="text-white font-bold w-full sm:w-auto bg-green-600 h-12 px-8"
          onPress={onOpen}
        >
          Request Leave
        </Button>
      </section>

      {/* STATS CARDS */}
      <div className="flex flex-row overflow-x-auto gap-4 pb-4 sm:grid sm:grid-cols-4 scrollbar-hide">
        {stats.map((stat, i) => (
          <Card key={i} className="min-w-40 border-none shadow-sm">
            <CardBody className="flex flex-col items-center justify-center p-4 sm:py-8 gap-1">
              {loading ? <Skeleton className="h-8 w-12 rounded-lg mb-2" /> : <p className={`text-2xl sm:text-4xl font-black ${stat.color}`}>{stat.value}</p>}
              <p className="font-bold text-blue-500 uppercase text-[10px] tracking-wider">{stat.label}</p>
              <small className="text-gray-400 text-[10px]">Leaves</small>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 sm:gap-8">
        <Card className="shadow-sm xl:col-span-2 overflow-hidden border-none">
          <CardHeader className="flex flex-col items-start px-6 pt-6 pb-2">
            <p className="text-tiny uppercase font-bold text-primary tracking-wider">Live Connection</p>
            <h2 className="text-xl font-bold">FastAPI Status</h2>
          </CardHeader>
          <Divider className="opacity-50" />
          <CardBody className="py-12 flex flex-col items-center justify-center">
            {loading ? <Spinner color="primary" /> : (
              <div className="text-center">
                <p className="text-lg font-bold mb-4 text-gray-700">{apiData}</p>
                <Chip color={apiData.toLowerCase().includes("running") ? "success" : "danger"} variant="flat" className="px-4 py-1">
                  {apiData.toLowerCase().includes("running") ? "● Server Online" : "○ Offline"}
                </Chip>
              </div>
            )}
          </CardBody>
          <Divider className="opacity-50" />
          <div className="p-4 flex justify-between items-center bg-gray-50/30">
            <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">Env: Production</span>
            <Button size="sm" variant="light" color="primary" className="font-bold" onPress={fetchData}>Refresh Data</Button>
          </div>
        </Card>

        <div className="xl:col-span-3">
          <LeaveHistoryTable data={leaveHistory} loading={loading} onCancelSuccess={fetchData} />
        </div>
      </div>
    </main>
  );
};

// --- MAIN APP COMPONENT WITH ROUTING ---
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("access_token"));
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [apiData, setApiData] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    const BASE_URL = "http://172.96.10.161:8000";
    const myToken = localStorage.getItem("access_token");
    const headers = { 'Authorization': `Bearer ${myToken}`, 'Content-Type': 'application/json' };

    try {
      fetch(BASE_URL).then(res => res.json()).then(data => setApiData(data.message || "Running")).catch(() => setApiData("Server Offline"));
      const [profileRes, historyRes] = await Promise.all([
        fetch(`${BASE_URL}/User/Me`, { headers }),
        fetch(`${BASE_URL}/LeaveHistory`, { headers })
      ]);
      if (profileRes.status === 401) return handleLogout();
      const profileData = await profileRes.json();
      const historyData = await historyRes.json();
      setUserProfile(profileData);
      setLeaveHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsAuthenticated(false);
    setLeaveHistory([]);
    setUserProfile(null);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 pb-10">
        <MainNavbar onLogout={handleLogout} />

        <RequestLeave 
          isOpen={isOpen} 
          onClose={onClose} 
          onSubmitSuccess={fetchData} 
        />

        <Routes>
          {/* Main Dashboard Route */}
          <Route path="/" element={
            <DashboardView 
              userProfile={userProfile}
              loading={loading}
              onOpen={onOpen}
              apiData={apiData}
              fetchData={fetchData}
              leaveHistory={leaveHistory}
            />
          } />

          {/* Information Page Route */}
          <Route path="/information" element={<InformationPage />} />

          {/* Catch-all: Redirect back to dashboard */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;