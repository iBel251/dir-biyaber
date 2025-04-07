import React, { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';

const ContactForm: React.FC = () => {
  const form = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    emailjs
      .sendForm(
        process.env.REACT_APP_EMAILJS_SERVICE_ID!, // Use environment variable
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID!, // Use environment variable
        form.current!,
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY! // Use environment variable
      )
      .then(
        () => {
          alert('Thank you for your message. We will get back to you soon!');
          form.current?.reset();
        },
        (error) => {
          console.error('Failed to send message:', error.text);
          alert('Failed to send your message. Please try again later.');
        }
      )
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Send us a message</h2>
      <form ref={form} onSubmit={sendEmail}>
        <div className="mb-6">
          <label htmlFor="name" className="block text-gray-700 mb-2 text-left">Full Name</label>
          <input
            type="text"
            id="name"
            name="from_name"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-colors text-sm"
            placeholder="Your name"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="email" className="block text-gray-700 mb-2 text-left">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-colors text-sm"
            placeholder="Your email"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="message" className="block text-gray-700 mb-2 text-left">Message</label>
          <textarea
            id="message"
            name="message"
            rows={6}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-colors text-sm resize-none"
            placeholder="Your message"
            required
          ></textarea>
        </div>
        <button
          type="submit"
          className={`!rounded-button whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg transition duration-300 cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
