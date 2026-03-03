import { useState, useEffect } from 'react';
import { 
  Card, CardBody, Divider, Button, Chip, Spinner,
  User, Skeleton, useDisclosure, CardHeader,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Avatar
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
  userProfile, loading, onOpen, apiData, fetchData, leaveHistory, onOpenUserProfile 
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
        <div onClick={onOpenUserProfile} className="cursor-pointer">
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
        </div>
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
  const { isOpen: isUserProfileOpen, onOpen: onOpenUserProfile, onClose: onCloseUserProfile } = useDisclosure();

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

        <Modal isOpen={isUserProfileOpen} onClose={onCloseUserProfile} placement="top-center" backdrop="blur">
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">User Profile</ModalHeader>
            <ModalBody>
              {loading ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <Skeleton className="h-6 w-48 rounded-lg" />
                  <Skeleton className="h-4 w-32 rounded-lg" />
                </div>
              ) : (
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex flex-col items-center gap-3">
                    <Avatar showFallback size="lg" isBordered className="border-green-600 border-2 bg-white text-slate-400" />
                    <div className="text-center">
                      <p className="text-lg font-bold uppercase">{userProfile?.full_name || "User"}</p>
                      <p className="text-sm text-gray-500">{userProfile?.company || "N/A"}</p>
                    </div>
                  </div>
                  <Divider />
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Employee ID:</span>
                      <span className="font-medium">{userProfile?.EmployeeId || userProfile?.id || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Username:</span>
                      <span className="font-medium">{userProfile?.username || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Email:</span>
                      <span className="font-medium text-sm">{userProfile?.email || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Company Code:</span>
                      <span className="font-medium">{userProfile?.company_code || "N/A"}</span>
                    </div>
                  </div>
                  <Divider />
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-bold text-gray-600 mb-2">Leave Credits Summary</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ending Balance:</span>
                        <span className="font-medium">{userProfile?.credits?.ending_balance ?? "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Earned:</span>
                        <span className="font-medium text-blue-600">{userProfile?.credits?.earned ?? "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Consumed:</span>
                        <span className="font-medium text-red-600">{userProfile?.credits?.consumed ?? "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Available:</span>
                        <span className="font-medium text-green-600">{userProfile?.credits?.available ?? "0"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        <Routes>
          {/* Main Dashboard Route */}
          <Route path="/" element={
            <DashboardView 
              userProfile={userProfile}
              loading={loading}
              onOpen={onOpen}
              onOpenUserProfile={onOpenUserProfile}
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
