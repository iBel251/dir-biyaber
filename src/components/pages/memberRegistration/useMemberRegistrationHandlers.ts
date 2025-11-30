import { useState } from "react";
import { saveMemberData } from "../../../firebase/firebaseMembersServices";

export const useMemberRegistrationHandlers = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    membershipId: "",
    email: "",
    gender: "",
    address: "",
    city: "Los Angeles", // Default value
    state: "California", // Default value
    apartment: "",
    phone: "",
    zipCode: "", // Add zipCode to formData
    status: "new", // Always include status: 'new' in formData
    beneficiaryFullName: "",
    beneficiaryPhone: "",
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    membershipId: "",
    email: "",
    gender: "",
    address: "",
    city: "", // Added city field
    state: "", // Added state field
    apartment: "", // Added apartment field
    phone: "",
    zipCode: "", // Add zipCode to errors
    beneficiaryFullName: "",
    beneficiaryPhone: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Prevent non-numeric input for membershipId
    if (name === "membershipId" && !/^[0-9]*$/.test(value)) {
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, "");

    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setFormData({
      ...formData,
      phone: formattedNumber,
    });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Validate First Name
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
      isValid = false;
    }

    // Validate Last Name
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
      isValid = false;
    }

    // Validate Membership ID (number only)
    if (!formData.membershipId.trim() || !/^[0-9]+$/.test(formData.membershipId)) {
      newErrors.membershipId = "Membership ID must be a number";
      isValid = false;
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = "Valid email is required";
      isValid = false;
    }

    // Validate Gender
    if (!formData.gender) {
      newErrors.gender = "Please select a gender";
      isValid = false;
    }

    // Validate Address
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
      isValid = false;
    }

    // Validate City
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
      isValid = false;
    }

    // Validate State
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
      isValid = false;
    }

    // Validate Zip Code
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "Zip code is required";
      isValid = false;
    }

    // Validate Phone
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Valid phone number is required";
      isValid = false;
    }

    // Validate Beneficiary Full Name
    if (!formData.beneficiaryFullName.trim()) {
      newErrors.beneficiaryFullName = "Beneficiary full name is required";
      isValid = false;
    }
    // Validate Beneficiary Phone
    if (!formData.beneficiaryPhone.trim() || formData.beneficiaryPhone.replace(/\D/g, "").length < 10) {
      newErrors.beneficiaryPhone = "Valid beneficiary phone number is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();

    if (validateForm()) {
      try {
        await saveMemberData(formData);
        console.log("Member data saved successfully.");
        return true; // Return true on success
      } catch (error) {
        console.error("Error saving member data:", error);
        alert("An error occurred while saving your data. Please try again.");
        return false; // Return false on failure
      }
    }
    return false; // Return false if validation fails
  };

  return {
    formData,
    errors,
    handleChange,
    handlePhoneChange,
    handleSubmit,
  };
};