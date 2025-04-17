import React, { useEffect, useState } from 'react';
import { fetchPosts } from '../../../firebase/firebaseAdminServices';

const Announcement: React.FC<{ language: string }> = ({ language }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPosts = async () => {
      try {
        const postsData = await fetchPosts();
        const blogPosts = postsData.filter((post: any) => post.section === "announcement"); // Filter posts by section
        setPosts(blogPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    getPosts();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading announcements...</div>;
  }

  return (
    <section 
      id="blogs" 
      className="min-h-screen py-4 bg-gradient-to-r from-gray-50 via-white to-gray-50"
      style={{
        backgroundImage: 'url("/images/blog-pattern.svg")',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="amharic-text max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <div key={post.id}>
              <div 
                className="flex flex-col md:flex-row gap-8 py-8"
              >
                {post.imageUrl && (
                  <div className="md:w-1/3 flex-shrink-0">
                    <div className="rounded-2xl overflow-hidden shadow-lg">
                      <img 
                        src={post.imageUrl} 
                        alt={post.header} 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                )}
                <div className="md:w-2/3 flex-grow w-full">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                    {language === 'am' && post.amharicHeader ? post.amharicHeader : post.header}
                  </h2>
                  {(language === 'am' && post.amharicBody ? post.amharicBody : post.body)
                    .split('\n')
                    .map((paragraph: string, idx: number) => (
                      <p key={idx} className="text-gray-700 text-lg mb-6 leading-normal">
                        {paragraph}
                      </p>
                    ))}
                </div>
              </div>
              {index < posts.length - 1 && (
                <div className="border-t-2 border-gray-300 my-6"></div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-700">No announcements today.</p>
        )}
      </div>
    </section>
  );
};

export default Announcement;
