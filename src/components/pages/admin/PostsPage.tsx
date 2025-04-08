import React, { useEffect, useState } from 'react';
import { fetchPosts, addPost, deletePost, editPostImage, editPost } from '../../../firebase/firebaseAdminServices';
import PostModal from './PostModal';
import EditPostModal from './EditPostModal'; // Import your new modal

const PostsPage: React.FC<{ adminRole: string }> = ({ adminRole }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<any | null>(null);
  const [newPost, setNewPost] = useState<{ header: string; body: string; image: File | null }>({ header: '', body: '', image: null });
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
      setNewPost({ header: '', body: '', image: null });
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

  const handleEditContent = async (postId: string, header: string, body: string) => {
    try {
      await editPost(postId, { header, body });
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
          {posts.map(post => (
            <div 
              key={post.id}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col md:flex-row items-center gap-6"
            >
              {post.imageUrl && (
                <div className="md:w-1/2">
                  <img 
                    src={post.imageUrl} 
                    alt={post.header} 
                    className="w-full h-48 md:h-auto object-cover rounded-lg"
                  />
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
              )}
              <div className="md:w-1/2">
                <h2 className="text-lg font-semibold mb-2">{post.header}</h2>
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
          onSave={(header, body) => handleEditContent(postToEdit.id, header, body)}
          postToEdit={postToEdit || { id: '', header: '', body: '' }}
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
