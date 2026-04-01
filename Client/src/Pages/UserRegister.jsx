import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { signupOptions } from "../Data/Variables";
import InputField from "../Components/Form/InputField";
import InputTags from "../Components/Form/InputTags";
import Footer from "../Components/User/Footer";
import banner from "../Assets/Banner/undraw_voting_n77r.svg";
import "react-toastify/dist/ReactToastify.css";

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
      // Simulate/Send OTP via backend
      await axios.post("https://e-votingproject.onrender.com/api/auth/otp", { 
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
      const { data } = await axios.post("https://e-votingproject.onrender.com/api/auth/register", values);
      if (data.status === false) {
        toast.error(data.message, signupOptions);
      } else {
        toast.success("Registered Successfully!", signupOptions);
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      toast.error("Registration failed. Please try again.", signupOptions);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  return (
    <>
      <div className="signup__root d-flex align-items-center justify-content-center">
        <div className="signup__container d-flex shadow-lg bg-white overflow-hidden">
          {/* Banner */}
          <div className="signup__banner d-none d-md-flex flex-column align-items-center justify-content-center text-white">
            <img src={banner} alt="Signup" className="img-fluid mb-4 px-4" />
            <h2 className="fw-bold">Welcome!</h2>
            <p className="px-5 text-center">Join the transparent and secure voting revolution.</p>
          </div>

          {/* Form */}
          <div className="signup__form p-4 p-md-5 overflow-auto">
            <h1 className="mb-4 fw-bold">Sign Up</h1>
            <p className="text-secondary mb-4">Create your account to cast your vote.</p>

            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-12">
                <InputField label="Full Name" placeholder="Enter Full Name" name="name" onChange={handleChange} required />
              </div>

              <div className="col-12">
                <div className="input-group">
                  <InputField label="Email ID" placeholder="Email Address" type="email" name="email" onChange={handleChange} required />
                  <button 
                    type="button" 
                    className="btn btn-outline-primary ms-2 mt-4" 
                    style={{ height: '45px' }} 
                    onClick={handleSendEmailOtp} 
                    disabled={emailVerified || loading}
                  >
                    {emailVerified ? "Verified" : "Send OTP"}
                  </button>
                </div>
              </div>

              {!emailVerified && emailOtpSent && (
                <div className="col-12 d-flex align-items-center">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Email OTP"
                    onChange={(e) => setTypedEmailOtp(e.target.value)}
                  />
                  <button type="button" className="btn btn-success ms-2" onClick={verifyEmailOtp}>Verify</button>
                </div>
              )}

              <div className="col-md-6">
                <InputField label="Aadhar Number" placeholder="12-digit UID" name="aadhar" onChange={handleChange} required />
              </div>

              <div className="col-md-6">
                <InputField label="Date of Birth" type="date" name="dob" onChange={handleChange} required />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Gender</label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="gender" value="Male" onChange={handleChange} id="male" required />
                    <label className="form-check-label" htmlFor="male">Male</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="gender" value="Female" onChange={handleChange} id="female" />
                    <label className="form-check-label" htmlFor="female">Female</label>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <InputField label="Residential Address" placeholder="Street/Area" name="address" onChange={handleChange} required />
              </div>

              <div className="col-md-4">
                <InputField label="City" placeholder="City" name="city" onChange={handleChange} required />
              </div>
              <div className="col-md-4">
                <InputField label="State" placeholder="State" name="state" onChange={handleChange} required />
              </div>
              <div className="col-md-4">
                <InputField label="Pincode" placeholder="Pincode" name="pincode" onChange={handleChange} required />
              </div>

              <div className="col-md-6">
                <InputField label="Password" type="password" name="password" onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <InputField label="Confirm Password" type="password" name="confirmPassword" onChange={handleChange} required />
              </div>

              <div className="col-12 mt-4">
                <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={!emailVerified || loading}>
                  {loading ? "Registering..." : "Create Account"}
                </button>
              </div>

              <div className="col-12 text-center mt-3">
                <span className="text-secondary">Already have an account? </span>
                <Link to="/login" className="text-decoration-none fw-bold">Login here</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
      <ToastContainer />
    </>
  );
};

export default UserRegister;