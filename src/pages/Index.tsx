import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Landing from "./Landing";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;
  return <Landing />;
};

export default Index;
