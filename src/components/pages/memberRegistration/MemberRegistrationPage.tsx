import React, { useState } from "react";
import { useMemberRegistrationHandlers } from "./useMemberRegistrationHandlers";
import SuccessModal from "./SuccessModal";
import { useNavigate } from "react-router-dom";

const MemberRegistrationPage: React.FC = () => {
  const {
    formData,
    errors,
    handleChange,
    handlePhoneChange,
    handleSubmit,
  } = useMemberRegistrationHandlers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // State to track loading
  const navigate = useNavigate();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Start loading
    const isValid = await handleSubmit(e);
    setIsLoading(false); // Stop loading
    if (isValid !== undefined && isValid) {
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    navigate("/"); // Ensure navigation to home on modal close
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Membership Profile Update
          </h1>
          <p className="text-gray-600">
            Please fill out the form below to update your membership profile.
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg px-6 py-8 mb-8">
          <form onSubmit={handleFormSubmit}>
            {/* Name Fields - Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1 text-left"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.firstName ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1 text-left"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.lastName ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Membership ID */}
            <div className="mb-6">
              <label
                htmlFor="membershipId"
                className="block text-sm font-medium text-gray-700 mb-1 text-left"
              >
                Membership ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="membershipId"
                name="membershipId"
                value={formData.membershipId}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${errors.membershipId ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm`}
                placeholder="Enter your membership ID"
              />
              {errors.membershipId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.membershipId}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1 text-left"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm`}
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Gender */}
            <div className="mb-6">
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700 mb-1 text-left"
              >
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.gender ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer bg-white`}
                >
                  <option value="">Select gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>

            {/* Address */}
            <div className="mb-6">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1 text-left"
              >
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${errors.address ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm`}
                placeholder="Enter your address"
              />
             
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            {/* Address Details - Four Column Layout in Standard Sequence */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div>
                <label
                  htmlFor="apartment"
                  className="block text-sm font-medium text-gray-700 mb-1 text-left"
                >
                  Apartment
                </label>
                <input
                  type="text"
                  id="apartment"
                  name="apartment"
                  value={formData.apartment}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter your apartment number"
                />
              </div>
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 mb-1 text-left"
                >
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.city ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  placeholder="Enter your city"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700 mb-1 text-left"
                >
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.state ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  placeholder="Enter your state"
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="zipCode"
                  className="block text-sm font-medium text-gray-700 mb-1 text-left"
                >
                  Zip Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.zipCode ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  placeholder="Enter your zip code"
                />
                {errors.zipCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="mb-8">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1 text-left"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <i className="fas fa-phone text-gray-400"></i>
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className={`w-full pl-10 px-4 py-2 border ${errors.phone ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  placeholder="(123) 456-7890"
                  maxLength={14}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Beneficiary Fields */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="beneficiaryFullName"
                  className="block text-sm font-medium text-gray-700 mb-1 text-left"
                >
                  Beneficiary(ወራሽ) Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="beneficiaryFullName"
                  name="beneficiaryFullName"
                  value={formData.beneficiaryFullName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.beneficiaryFullName ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  placeholder="Enter beneficiary's full name"
                />
                {errors.beneficiaryFullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.beneficiaryFullName}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="beneficiaryPhone"
                  className="block text-sm font-medium text-gray-700 mb-1 text-left"
                >
                  Beneficiary(ወራሽ) Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="beneficiaryPhone"
                  name="beneficiaryPhone"
                  value={formData.beneficiaryPhone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.beneficiaryPhone ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  placeholder="(123) 456-7890"
                  maxLength={14}
                />
                {errors.beneficiaryPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.beneficiaryPhone}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="!rounded-button whitespace-nowrap px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                disabled={isLoading} // Disable button while loading
              >
                {isLoading ? "Loading..." : "Complete Registration"}
              </button>
            </div>
          </form>
        </div>

      </div>

      <SuccessModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default MemberRegistrationPage;