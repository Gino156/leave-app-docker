import { useState, useEffect } from 'react';
import { Button, Input, Link, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

import ftpLogo from '../assets/ftp.svg'; 
import autumnIntro from '../assets/Autumn-bro.svg'; 

export default function LoginPage({ onLoginSuccess }) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => setStep(2), 3000); 
      return () => clearTimeout(timer);
    }
  }, [step]);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch("http://172.96.10.161:8000/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("access_token", data.access_token);
        onLoginSuccess();
      } else {
        setError(data.detail || "Invalid credentials.");
      }
    } catch (err) {
      setError("System unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#fcfcfc] overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: SPLASH SCREEN */}
        {step === 1 && (
          <motion.div 
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-green-600"
          >
            <div className="relative z-20 flex flex-col items-center justify-center">
              <div className="bg-white p-4 rounded-4xl shadow-2xl flex items-center justify-center">
                <img 
                  src={ftpLogo} 
                  className="w-40 h-40 object-contain" 
                  alt="FTP Logo"
                  // Optimization: Priority loading para sa Splash Logo
                  fetchpriority="high"
                  loading="eager"
                />
              </div>

              <div className="mt-8 text-center">
                <h1 className="text-white text-3xl font-black tracking-tighter uppercase">FTP LEAVE APP</h1>
                <p className="text-green-100 text-xs font-bold tracking-[0.3em] mt-1 opacity-70">PORTAL V1.3</p>
                <Spinner color="success" className="mt-4" />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: INTRO CARD */}
        {step === 2 && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm flex flex-col items-center p-6"
          >
            <div className="w-full h-80 flex items-center justify-center mb-10 drop-shadow-2xl">
              <img 
                src={autumnIntro} 
                className="w-full h-full object-contain"
                alt="Autumn Illustration"
                // Optimization: Mahalaga ito dahil ito ang LCP element sa Step 2
                fetchpriority="high"
                loading="eager"
              />
            </div>

            <div className="text-center px-4">
              <h2 className="text-3xl font-black text-slate-800 leading-tight">
                Plan Your <span className="text-green-600">Leaves</span>
              </h2>
              <p className="text-slate-500 mt-4 mb-10 text-lg leading-relaxed">
                Manage your credits and file applications with just a few taps.
              </p>
              
              <Button 
                onPress={() => setStep(3)}
                className="bg-green-600 text-white font-black w-full h-16 rounded-2xl shadow-xl shadow-green-200 text-lg"
              >
                NEXT
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: LOGIN FORM */}
        {step === 3 && (
          <motion.div 
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center bg--white overflow-y-auto py-10"
          >
            <div className="w-full flex flex-col items-center justify-center px-8 text-center mb-8">
              {/* Inalis ang initial animation sa img para mag-load agad */}
              <img 
                src={ftpLogo} 
                alt="FTP Logo" 
                className="w-20 h-20 mb-4 object-contain"
                fetchpriority="high"
              />
              <motion.h1 
                // animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-black text-4xl font-black tracking-tight"
              >
                FTP LEAVE APP
              </motion.h1>
              <p className="text-green-500 font-medium opacity-80 mt-1 text-sm">
                Secure Employee Access
              </p>
            </div>

            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-[90%] max-w-105 bg-white rounded-[2.5rem] px-8 py-10 shadow-2xl shadow-green-300 flex flex-col"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-800 leading-none">Login</h2>
                <div className="h-1.5 w-10 bg-green-500 rounded-full mt-3" />
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Input
                  isRequired
                  label="Username"
                  placeholder="Enter your username"
                  variant="flat"
                  size="md"
                  labelPlacement="outside"
                  classNames={{ 
                    inputWrapper: "bg-slate-100/80 rounded-2xl h-12 border-none px-4", 
                    label: "font-bold text-slate-700 ml-1 text-sm" 
                  }}
                  startContent={<Icon icon="solar:user-circle-bold" className="text-xl text-slate-400" />}
                  value={username}
                  onValueChange={setUsername}
                />

                <div className="flex flex-col gap-2">
                  <Input
                    isRequired
                    label="Password"
                    placeholder="••••••••"
                    variant="flat"
                    size="md"
                    labelPlacement="outside"
                    classNames={{ 
                      inputWrapper: "bg-slate-100/80 rounded-2xl h-12 border-none px-4", 
                      label: "font-bold text-slate-700 ml-1 text-sm" 
                    }}
                    startContent={<Icon icon="solar:lock-password-unlocked-bold" className="text-xl text-slate-400" />}
                    type={isVisible ? "text" : "password"}
                    endContent={
                      <button type="button" onClick={toggleVisibility} className="focus:outline-none">
                        <Icon icon={isVisible ? "solar:eye-closed-bold" : "solar:eye-bold"} className="text-xl text-slate-400" />
                      </button>
                    }
                    value={password}
                    onValueChange={setPassword}
                  />
                  <div className="flex justify-end">
                    <Link size="sm" className="font-bold text-green-700 text-xs cursor-pointer">Forgot Password?</Link>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 rounded-xl flex items-center gap-2 border border-red-100">
                    <Icon icon="solar:danger-circle-bold" className="text-red-500" />
                    <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider">{error}</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  isLoading={loading}
                  className="w-full bg-green-600 text-white font-black h-14 rounded-2xl shadow-lg shadow-green-100 mt-4"
                >
                  LOG IN
                </Button>
                
                <p className="text-center text-slate-400 text-xs mt-6 font-medium">
                  Don't have an account? <Link className="text-green-700 font-bold ml-1 cursor-pointer">Sign Up</Link>
                </p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}