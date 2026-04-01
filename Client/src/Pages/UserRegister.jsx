import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { signupOptions } from "../Data/Variables";
import "react-toastify/dist/ReactToastify.css";
import { serverLink } from "../Data/Variables";

const UserRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [typedEmailOtp, setTypedEmailOtp] = useState("");
  const [actualEmailOtp, setActualEmailOtp] = useState("");

  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    aadhar: "",
    dob: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendEmailOtp = async () => {
    if (!values.email) {
      toast.error("Please enter your email first!", signupOptions);
      return;
    }
    setLoading(true);
    const otp = generateOTP();
    setActualEmailOtp(otp);

    try {
      await axios.post(serverLink + "otp", { 
        identifier: values.email, 
        otp 
      });
      setEmailOtpSent(true);
      toast.success("OTP sent to your email!", signupOptions);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send OTP.", signupOptions);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = () => {
    if (typedEmailOtp === actualEmailOtp) {
      setEmailVerified(true);
      toast.success("Email verified successfully!", signupOptions);
    } else {
      toast.error("Incorrect OTP!", signupOptions);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!emailVerified) {
      toast.error("Please verify your email first!", signupOptions);
      return;
    }
    if (values.password !== values.confirmPassword) {
      toast.error("Passwords do not match!", signupOptions);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(serverLink + "register", values);
      if (data.status === false) {
        toast.error(data.message, signupOptions);
      } else {
        toast.success("Registered Successfully!", signupOptions);
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      toast.error("Registration failed.", signupOptions);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  return (
    <div className="container-fluid py-5" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <ToastContainer />
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-lg border-0 rounded-3">
            <div className="card-header bg-primary text-white p-4">
              <h2 className="mb-0 fw-bold">Voter Registration</h2>
              <p className="mb-0 opacity-75">Sign up to participate in the secure blockchain election.</p>
            </div>
            <div className="card-body p-5">
              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  
                  <div className="col-12">
                     <label className="form-label fw-bold">Full Name</label>
                     <input type="text" name="name" className="form-control form-control-lg" placeholder="John Doe" onChange={handleChange} required />
                  </div>

                  <div className="col-md-9">
                     <label className="form-label fw-bold">Email ID</label>
                     <input type="email" name="email" className="form-control form-control-lg" placeholder="john@example.com" disabled={emailVerified} onChange={handleChange} required />
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                     <button type="button" className="btn btn-outline-primary btn-lg w-100" onClick={handleSendEmailOtp} disabled={emailVerified || loading}>
                        {emailVerified ? "Verified" : "Send OTP"}
                     </button>
                  </div>

                  {!emailVerified && emailOtpSent && (
                    <div className="col-12">
                       <div className="input-group">
                          <input type="text" className="form-control form-control-lg" placeholder="6-digit OTP" onChange={(e) => setTypedEmailOtp(e.target.value)} />
                          <button type="button" className="btn btn-success" onClick={verifyEmailOtp}>Verify</button>
                       </div>
                    </div>
                  )}

                  <div className="col-md-6">
                     <label className="form-label fw-bold">Aadhar Number</label>
                     <input type="text" name="aadhar" className="form-control form-control-lg" placeholder="12-digit number" onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                     <label className="form-label fw-bold">Date of Birth</label>
                     <input type="date" name="dob" className="form-control form-control-lg" onChange={handleChange} required />
                  </div>

                  <div className="col-12">
                     <label className="form-label fw-bold d-block">Gender</label>
                     <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="gender" value="Male" onChange={handleChange} required />
                        <label className="form-check-label">Male</label>
                     </div>
                     <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="gender" value="Female" onChange={handleChange} />
                        <label className="form-check-label">Female</label>
                     </div>
                  </div>

                  <div className="col-12">
                     <label className="form-label fw-bold">Residential Address</label>
                     <textarea name="address" className="form-control" rows="3" onChange={handleChange} required></textarea>
                  </div>

                  <div className="col-md-4">
                     <label className="form-label fw-bold">City</label>
                     <input type="text" name="city" className="form-control" onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                     <label className="form-label fw-bold">State</label>
                     <input type="text" name="state" className="form-control" onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                     <label className="form-label fw-bold">Pincode</label>
                     <input type="text" name="pincode" className="form-control" onChange={handleChange} required />
                  </div>

                  <div className="col-md-6">
                     <label className="form-label fw-bold">Password</label>
                     <input type="password" name="password" className="form-control form-control-lg" onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                     <label className="form-label fw-bold">Confirm Password</label>
                     <input type="password" name="confirmPassword" className="form-control form-control-lg" onChange={handleChange} required />
                  </div>

                  <div className="col-12 mt-5">
                     <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold py-3" disabled={!emailVerified || loading}>
                        {loading ? "Registering..." : "COMPLETE REGISTRATION"}
                     </button>
                  </div>

                </div>
              </form>
            </div>
          </div>
          <div className="text-center mt-4">
             <p className="text-muted">Already registered? <Link to="/login" className="fw-bold text-decoration-none">Login here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegister;