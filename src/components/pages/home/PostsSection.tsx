import React, { useEffect, useState } from 'react';
import { fetchPosts } from '../../../firebase/firebaseAdminServices';

const PostsSection: React.FC<{ language: string }> = ({ language }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPosts = async () => {
      try {
        const postsData = await fetchPosts();
        const homePosts = postsData.filter((post: any) => post.section === "home"); // Filter posts by section
        setPosts(homePosts);
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
      <div className="amharic-text max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <div key={post.id}>
              <div 
                className="flex flex-col gap-8 py-8 items-center text-center"
              >
                {post.imageUrl && (
                  <div className=" max-w-md mx-auto rounded-2xl overflow-hidden shadow-xl">
                    <img 
                      src={post.imageUrl} 
                      alt={post.header} 
                      className="w-full h-auto object-contain max-h-64"
                    />
                  </div>
                )}
                <div className="md:w-2/3 flex-grow w-full">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">
                    {language === 'am' && post.amharicHeader ? post.amharicHeader : post.header}
                  </h2>
                  {(language === 'am' && post.amharicBody ? post.amharicBody : post.body)
                    .split('\n')
                    .map((paragraph: string, idx: number) => (
                      <p key={idx} className="text-gray-600 text-lg mb-6 leading-normal text-justify">
                        {paragraph}
                      </p>
                    ))}
                </div>
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
