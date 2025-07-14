import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SharePage.module.css";

const SharePage = () => {
  const [tags, setTags] = useState([]);
  const [stories, setStories] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [likedStories, setLikedStories] = useState({});
  const [likeCounts, setLikeCounts] = useState({});

  const navigate = useNavigate();
  const BACKEND_URL = "http://localhost:8000";

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const [predefinedTagsRes, dbTagsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/v1/shares/share/tags`),
          fetch(`${BACKEND_URL}/api/v1/shares/share/db-tags`),
        ]);
        if (!predefinedTagsRes.ok || !dbTagsRes.ok)
          throw new Error("태그 로딩 실패");
        const predefinedTags = await predefinedTagsRes.json();
        const dbTags = await dbTagsRes.json();
        setTags([...new Set([...predefinedTags, ...dbTags])]);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const fetchStoriesAndLikes = async () => {
      setLoading(true);
      try {
        let url = `${BACKEND_URL}/api/v1/shares/shared/stories`;
        if (selectedTag) url += `?tag=${encodeURIComponent(selectedTag)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("동화 로딩 실패");
        const storiesData = await response.json();
        setStories(storiesData);

        if (storiesData.length > 0) {
          const token = localStorage.getItem("access_token");
          const authHeaders = { Authorization: `Bearer ${token}` };

          const dataPromises = storiesData.map((sharedStory) => {
            const storyId = sharedStory.story.id;
            const countPromise = fetch(
              `${BACKEND_URL}/api/v1/likes/community/like/${storyId}`
            ).then((res) => (res.ok ? res.json() : { likes: 0 }));
            const statusPromise = token
              ? fetch(
                  `${BACKEND_URL}/api/v1/likes/community/like/me/${storyId}`,
                  { headers: authHeaders }
                ).then((res) => (res.ok ? res.json() : { liked: false }))
              : Promise.resolve({ liked: false });
            return Promise.all([countPromise, statusPromise]).then(
              ([countData, statusData]) => ({
                storyId,
                count: countData.likes || 0,
                isLiked: statusData.liked || false,
              })
            );
          });

          const allData = await Promise.all(dataPromises);
          const newLikeCounts = {};
          const newLikedStories = {};
          allData.forEach(({ storyId, count, isLiked }) => {
            newLikeCounts[storyId] = count;
            newLikedStories[storyId] = isLiked;
          });
          setLikeCounts(newLikeCounts);
          setLikedStories(newLikedStories);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStoriesAndLikes();
  }, [selectedTag]);

  const handleLikeToggle = async (e, storyId) => {
    e.stopPropagation();
    const token = localStorage.getItem("access_token");
    if (!token) return alert("로그인이 필요합니다.");
    const isLiked = !!likedStories[storyId];
    const originalCount = likeCounts[storyId] || 0;

    setLikedStories((prev) => ({ ...prev, [storyId]: !isLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [storyId]: isLiked ? originalCount - 1 : originalCount + 1,
    }));

    try {
      await fetch(
        `${BACKEND_URL}/api/v1/likes/community/like/${storyId}`,
        {
          method: isLiked ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.error(err);
      setLikedStories((prev) => ({ ...prev, [storyId]: isLiked }));
      setLikeCounts((prev) => ({ ...prev, [storyId]: originalCount }));
    }
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.pageTitle}>모두의 동화</h1>
        <div className={styles.tagContainer}>
          <button
            onClick={() => setSelectedTag(null)}
            className={`${styles.tagButton} ${
              !selectedTag ? styles.active : ""
            }`}
          >
            #전체
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag((p) => (p === tag ? null : tag))}
              className={`${styles.tagButton} ${
                selectedTag === tag ? styles.active : ""
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {loading && (
          <div className={styles.message}>
            다른 친구들의 동화를 찾고 있어요...
          </div>
        )}
        {error && <div className={styles.message}>{error}</div>}
        {!loading && !error && (
          <div className={styles.storyList}>
            {stories.map((sharedStory) => {
              const story = sharedStory.story;
              const isLiked = !!likedStories[story.id];
              const thumbnailUrl = story.scenes?.[0]?.image_url
                ? `${BACKEND_URL}/illustrations/${story.scenes[0].image_url
                    .split("/")
                    .pop()}`
                : "https://placehold.co/420x240/C0946C/4F3222?text=Quokka";

              return (
                <div
                  key={sharedStory.id}
                  className={styles.storyItem}
                  onClick={() => navigate(`/share/${story.id}`)}
                >
                  <div className={styles.storyHeader}>
                    <img
                      src={thumbnailUrl}
                      alt={story.title}
                      className={styles.storyImage}
                    />
                    <div className={styles.titleOverlay}>
                      <p className={styles.storyTitle}>
                        {story.title || "제목 없음"}
                      </p>
                      <div
                        className={`${styles.likeCountDisplay} ${
                          isLiked ? styles.likedHeart : ""
                        }`}
                        onClick={(e) => handleLikeToggle(e, story.id)}
                      >
                        ❤️ {likeCounts[story.id] || 0}
                      </div>
                    </div>
                  </div>
                  <div className={styles.storyContent}>
                    <div className={styles.storyActions}>
                      <button
                        onClick={(e) => handleLikeToggle(e, story.id)}
                        className={`${styles.actionButton} ${
                          isLiked ? styles.liked : ""
                        }`}
                      >
                        ❤️ {likeCounts[story.id] || 0}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharePage;