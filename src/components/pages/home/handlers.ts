import { useState } from "react";

export const useSubscribeHandler = () => {
  const [email, setEmail] = useState("");
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState({
    type: "",
    message: "",
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribeMessage({
        type: "success",
        message: "Successfully subscribed!",
      });
      setEmail("");
    } else {
      setSubscribeMessage({
        type: "error",
        message: "Please enter a valid email.",
      });
    }
    setShowSubscribeModal(true);
    setTimeout(() => setShowSubscribeModal(false), 3000);
  };

  return {
    email,
    setEmail,
    showSubscribeModal,
    subscribeMessage,
    handleSubscribe,
  };
};
