import React, { useEffect, useState } from 'react';
import { fetchPosts } from '../../../firebase/firebaseAdminServices';

const PostsSection: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="p-6">Loading posts...</div>;
  }

  return (
    <section 
      id="posts" 
      className="py-4 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100"
      style={{
        backgroundImage: 'url("/images/pattern.svg")',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <div key={post.id}>
              <div 
                className={`flex flex-col md:flex-row items-center gap-8 py-8 ${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'
                }`}
              >
                <div className="md:w-1/2 order-2 md:order-1">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">{post.header}</h2>
                  {post.body.split('\n').map((paragraph: string, idx: number) => (
                    <p key={idx} className="text-gray-600 text-lg mb-6 leading-relaxed text-justify">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {post.imageUrl && (
                  <div className="md:w-1/2 order-1 md:order-2">
                    <div className="rounded-2xl overflow-hidden shadow-xl">
                      <img 
                        src={post.imageUrl} 
                        alt={post.header} 
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>
                )}
              </div>
              {index < posts.length - 1 && (
                <div className="border-t-2 border-orange-300 my-6"></div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">No posts available.</p>
        )}
      </div>
    </section>
  );
};

export default PostsSection;
