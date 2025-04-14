import React, { useState } from 'react';

interface PostModalProps {
  show: boolean;
  onClose: () => void;
  onAddPost: () => void;
  newPost: { header: string; body: string; image: File | null; section: string };
  setNewPost: (post: { header: string; body: string; image: File | null; section: string }) => void;
}

const PostModal: React.FC<PostModalProps> = ({ show, onClose, onAddPost, newPost, setNewPost }) => {
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  if (!show) return null;

  const handleAddPost = async () => {
    if (!newPost.header.trim() || !newPost.body.trim()) {
      alert("Header and body cannot be empty.");
      return;
    }

    if (newPost.image) {
      const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/webm"];
      if (!validImageTypes.includes(newPost.image.type)) {
        alert("Invalid image type. Only JPG, PNG, WEBP, and WEBM are allowed.");
        return;
      }
      if (newPost.image.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Image size must be less than 5MB.");
        return;
      }
    }

    setIsLoading(true); // Set loading state to true
    try {
      await onAddPost();
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Add New Post</h2>
        <input 
          type="text" 
          placeholder="Header" 
          value={newPost.header} 
          onChange={(e) => setNewPost({ ...newPost, header: e.target.value })} 
          className="w-full mb-4 p-2 border rounded"
        />
        <textarea 
          placeholder="Body" 
          value={newPost.body} 
          onChange={(e) => setNewPost({ ...newPost, body: e.target.value })} 
          className="w-full mb-4 p-2 border rounded"
        />
        <select 
          value={newPost.section} 
          onChange={(e) => setNewPost({ ...newPost, section: e.target.value })} 
          className="w-full mb-4 p-2 border rounded"
        >
          <option value="">Select Section</option>
          <option value="blog">Blog</option>
          <option value="home">Home</option>
          <option value="about">About</option>
          <option value="announcement">Announcement</option> {/* New option added */}
        </select>
        <input 
          type="file" 
          onChange={(e) => setNewPost({ ...newPost, image: e.target.files ? e.target.files[0] : null })} 
          className="w-full mb-4"
        />
        <div className="flex justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 mr-2"
            disabled={isLoading} // Disable button while loading
          >
            Cancel
          </button>
          <button 
            onClick={handleAddPost} 
            className={`px-4 py-2 rounded text-white ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            disabled={isLoading} // Disable button while loading
          >
            {isLoading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
