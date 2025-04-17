import React, { useEffect, useState } from 'react';
import { fetchPosts, addPost, deletePost, editPostImage, editPost, updatePostsOrder } from '../../../firebase/firebaseAdminServices';
import PostModal from './PostModal';
import EditPostModal from './EditPostModal'; // Import your new modal

const PostsPage: React.FC<{ adminRole: string }> = ({ adminRole }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<any | null>(null);
  const [newPost, setNewPost] = useState<{ header: string; body: string; image: File | null; section: string }>({
    header: '',
    body: '',
    image: null,
    section: '', // Add section field
  });
  const [uploadingPostId, setUploadingPostId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState<any | null>(null);

  useEffect(() => {
    const getPosts = async () => {
      try {
        const postsData = await fetchPosts();
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    getPosts();
  }, []);

  const handleAddPost = async () => {
    try {
      await addPost(newPost);
      setShowAddModal(false);
      setNewPost({ header: '', body: '', image: null, section: '' }); // Reset section field
      const updatedPosts = await fetchPosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error("Error adding post:", error);
      throw error;
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await deletePost(postToDelete);
      setShowDeleteModal(false);
      setPostToDelete(null);
      const updatedPosts = await fetchPosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleEditImage = async (postId: string, newImage: File) => {
    setUploadingPostId(postId);
    try {
      await editPostImage(postId, newImage);
      const updatedPosts = await fetchPosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error("Error editing post image:", error);
    } finally {
      setUploadingPostId(null);
    }
  };

  const handleEditContent = async (postId: string, header: string, body: string, section: string, amharicHeader?: string, amharicBody?: string) => {
    try {
      await editPost(postId, { header, body, section, amharicHeader, amharicBody }); // Include Amharic fields
      const updatedPosts = await fetchPosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error("Error editing post:", error);
    }
  };

  const openFileManager = (postId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg, image/png, image/webp, image/webm';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        handleEditImage(postId, target.files[0]);
      }
    };
    input.click();
  };

  const movePostUp = async (index: number) => {
    if (index === 0) return; // Can't move the first post up
    const updatedPosts = [...posts];
    [updatedPosts[index - 1], updatedPosts[index]] = [updatedPosts[index], updatedPosts[index - 1]];
    setPosts(updatedPosts);

    try {
      await updatePostsOrder(updatedPosts); // Persist the new order
    } catch (error) {
      console.error("Error updating posts order:", error);
    }
  };

  const movePostDown = async (index: number) => {
    if (index === posts.length - 1) return; // Can't move the last post down
    const updatedPosts = [...posts];
    [updatedPosts[index], updatedPosts[index + 1]] = [updatedPosts[index + 1], updatedPosts[index]];
    setPosts(updatedPosts);

    try {
      await updatePostsOrder(updatedPosts); // Persist the new order
    } catch (error) {
      console.error("Error updating posts order:", error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading posts...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Posts</h1>
      {adminRole === 'superAdmin' && ( // Show only for superAdmin
        <button 
          onClick={() => setShowAddModal(true)} 
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Post
        </button>
      )}
      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post, index) => (
            <div 
              key={post.id}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col md:flex-row items-center gap-6"
            >
              <div className="md:w-1/2">
                {post.imageUrl ? (
                  <img 
                    src={post.imageUrl} 
                    alt={post.header} 
                    className="w-full h-48 md:h-auto object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 md:h-auto bg-gray-200 flex items-center justify-center rounded-lg">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                {adminRole === 'superAdmin' && ( // Show only for superAdmin
                  <button 
                    className={`mt-2 px-4 py-2 rounded text-white ${uploadingPostId === post.id ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                    onClick={() => openFileManager(post.id)}
                    disabled={uploadingPostId === post.id}
                  >
                    {uploadingPostId === post.id ? 'Uploading...' : 'Update Image'}
                  </button>
                )}
              </div>
              <div className="md:w-1/2">
                <h2 className="text-lg font-semibold mb-2">{post.header}</h2>
                <p className="text-sm text-gray-500 mb-2">Section: {post.section}</p> {/* Display section */}
                <div className="text-gray-600 mb-4">
                  {post.body.split('\n').map((paragraph: string, index: number) => (
                    <p key={index} className="mb-2">{paragraph}</p>
                  ))}
                </div>
                <p className="text-sm text-gray-500">Posted on: {new Date(post.createdAt).toLocaleDateString()}</p>
                {adminRole === 'superAdmin' && ( // Show only for superAdmin
                  <>
                    <button 
                      onClick={() => {
                        setPostToEdit(post);
                        setShowEditModal(true);
                      }}
                      className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        setPostToDelete(post);
                        setShowDeleteModal(true);
                      }} 
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-2"
                    >
                      Delete
                    </button>
                    <div className="flex mt-2">
                      {index > 0 && ( // Hide "Move Up" for the first post
                        <button 
                          onClick={() => movePostUp(index)} 
                          className="px-2 py-1 bg-gray-300 text-black rounded hover:bg-gray-400 mr-2"
                        >
                          ↑ Move Up
                        </button>
                      )}
                      {index < posts.length - 1 && ( // Hide "Move Down" for the last post
                        <button 
                          onClick={() => movePostDown(index)} 
                          className="px-2 py-1 bg-gray-300 text-black rounded hover:bg-gray-400"
                        >
                          ↓ Move Down
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No posts available.</p>
      )}
      {adminRole === 'superAdmin' && ( // Show only for superAdmin
        <PostModal 
          show={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          onAddPost={handleAddPost} 
          newPost={newPost} 
          setNewPost={setNewPost} 
        />
      )}
      {adminRole === 'superAdmin' && ( // Show only for superAdmin
        <EditPostModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={(header, body, section, amharicHeader, amharicBody) =>
            handleEditContent(postToEdit.id, header, body, section, amharicHeader, amharicBody)
          } // Pass Amharic fields
          postToEdit={postToEdit || { id: '', header: '', body: '', section: '', amharicHeader: '', amharicBody: '' }}
        />
      )}
      {showDeleteModal && adminRole === 'superAdmin' && ( // Show only for superAdmin
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this post?</p>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 mr-2"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeletePost} 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostsPage;
