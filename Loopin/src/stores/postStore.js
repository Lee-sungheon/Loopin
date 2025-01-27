import supabase from "@/config/supabase";
import { defineStore } from "pinia";
import { ref } from "vue";

export const usePostStore = defineStore("postStore", () => {
  const socialingPosts = ref([]);
  const clubPosts = ref([]);
  const challengePosts = ref([]);
  const loungePosts = ref([]);

  //클럽
  const loadClubPosts = async () => {
    let { data, error } = await supabase.from("club_posts").select("*");

    if (error) {
      //오류 발생 시 로직
      console.log(error);
    }
    if (data) {
      clubPosts.value = data;
      // subscribeClubPosts();
    }
  };
  // const subscribeClubPosts = () => {
  //   supabase
  //     .channel("club-posts-channel")
  //     .on("postgres_changes", { event: "*", schema: "public", table: "club_posts" }, (payload) => {
  //       if (payload.eventType === "INSERT") {
  //         clubPosts.value.push(payload.new);
  //       }
  //       if (payload.eventType === "DELETE") {
  //         const index = getClubPostIndexById(payload.old.id);
  //         clubPosts.value.splice(index, 1);
  //       }
  //       if (payload.eventType === "UPDATE") {
  //         const index = getClubPostIndexById(payload.new.id);
  //         Object.assign(clubPosts.value[index], payload.new);
  //       }
  //     })
  //     .subscribe();
  // };

  // const getClubPostIndexById = (postId) => {
  //   return clubPosts.value.findIndex((post) => post.id === postId);
  // };

  const deleteClubPost = async (postId, userId) => {
    //클럽 포스트 테이블에서 삭제
    const { error: deleteError } = await supabase.from("club_posts").delete().eq("id", postId);
    if (deleteError) {
      console.log("Failed to delete club post", deleteError);
      return;
    }
    //userinfo 테이블에서도 삭제
    const { data: userInfoData, error: userInfoError } = await supabase
      .from("userinfo")
      .select("posts")
      .eq("id", userId)
      .single();
    if (userInfoError) {
      console.log("Failed to delete userinfo data", userInfoError);
      return;
    }
    //해당 postId 삭제
    const updatedPosts = userInfoData.posts.filter((post) => {
      const postObj = JSON.parse(post); // JSON 문자열을 객체로 변환
      return postObj.id !== postId; // 해당 postId와 일치하는 항목을 제외
    });
    //필터링한 새로운 posts 배열로 업데이트
    const { error: updateError } = await supabase.from("userinfo").update({ posts: updatedPosts }).eq("id", userId);

    if (updateError) {
      console.log("Failed to update userinfo", updateError);
      return;
    }
  };

  const createClubPost = async (postInfo, userId) => {
    const post = {
      age_limit: Array.from(postInfo.age_limit) || [], // Proxy(Array) -> 일반 배열
      fee_info: Array.from(postInfo.fee_info) || [], // Proxy(Array) -> 일반 배열
      images: [...postInfo.images], // 이미지 URL
      title: postInfo.title,
      description: postInfo.description,
      subject: postInfo.subject,
      category: postInfo.category,
      fee: postInfo.fee,
      gender: postInfo.gender,
      max_people: postInfo.max_people,
      place: typeof postInfo.place === "string" ? postInfo.place : JSON.stringify({ ...postInfo.place }),
      participants: [userId],
    };

    try {
      const { data: clubPost, error: clubError } = await supabase.from("club_posts").insert([post]).select();
      if (clubError) throw new Error("클럽 업로드 에러", clubError);

      const postId = clubPost[0].id;

      // 유저 정보 가져옴
      const { data: userData, error: userError } = await supabase
        .from("userinfo")
        .select("posts")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      const currentPosts = userData.posts || [];

      const updatePosts = [...currentPosts, { id: postId, type: "club_posts" }];

      // 유저 정보 업데이트
      const updateResponse = await supabase.from("userinfo").update({ posts: updatePosts }).eq("id", userId).select();
      console.log("updateResponse", updateResponse);

      return clubPost;
    } catch (error) {
      console.error(error);
    }
  };
  const updateClubPost = async (newPostInfo, postId) => {
    try {
      const { data: updateData, error: updateError } = await supabase
        .from("club_posts")
        .update(newPostInfo)
        .eq("id", postId)
        .select();
      console.log(updateData);
      return updateData;
    } catch (error) {
      console.error(error);
    }
  };

  //챌린지
  const loadChallengePosts = async () => {
    let { data, error } = await supabase.from("challenge_posts").select("*");

    if (error) {
      //오류 발생 시 로직
      console.log(error);
    }
    if (data) {
      challengePosts.value = data;
      //실시간 구독
      // subscribeChallengePosts();
    }
  };

  // const subscribeChallengePosts = () => {
  //   supabase
  //     .channel("challenge-posts-channel")
  //     .on("postgres_changes", { event: "*", schema: "public", table: "challenge_posts" }, (payload) => {
  //       if (payload.eventType === "INSERT") {
  //         challengePosts.value.push(payload.new);
  //       }
  //       if (payload.eventType === "DELETE") {
  //         const index = getChallengePostIndexById(payload.old.id);
  //         challengePosts.value.splice(index, 1);
  //       }
  //       if (payload.eventType === "UPDATE") {
  //         const index = getChallengePostIndexById(payload.new.id);
  //         Object.assign(challengePosts.value[index], payload.new);
  //       }
  //     })
  //     .subscribe();
  // };

  // const getChallengePostIndexById = (postId) => {
  //   return challengePosts.value.findIndex((post) => post.id === postId);
  // };

  const deleteChallengePost = async (postId, userId) => {
    // 챌린지 포스트 테이블에서 삭제
    const { error: deleteError } = await supabase.from("challenge_posts").delete().eq("id", postId);
    if (deleteError) {
      console.log("Failed to delete challenge post", deleteError);
      return;
    }

    // userinfo 테이블에서 해당 사용자의 posts 가져오기
    const { data: userInfoData, error: userInfoError } = await supabase
      .from("userinfo")
      .select("posts")
      .eq("id", userId)
      .single();

    if (userInfoError) {
      console.log("Failed to fetch userinfo data", userInfoError);
      return;
    }

    // 해당 postId 삭제
    const updatedPosts = userInfoData.posts.filter((post) => {
      const postObj = JSON.parse(post); // JSON 문자열을 객체로 변환
      return postObj.id !== postId; // 해당 postId와 일치하는 항목을 제외
    });

    // 필터링한 새로운 posts 배열로 업데이트
    const { error: updateError } = await supabase.from("userinfo").update({ posts: updatedPosts }).eq("id", userId);

    if (updateError) {
      console.log("Failed to update userinfo", updateError);
      return;
    }
  };

  const createChallengePost = async (postInfo, userId) => {
    const post = {
      fee_info: Array.from(postInfo.fee_info) || [], // Proxy(Array) -> 일반 배열
      start_date: new Date(postInfo.start_date).toISOString().split("T")[0], // 날짜 포맷 변경
      end_date: new Date(postInfo.end_date).toISOString().split("T")[0], // 날짜 포맷 변경
      images: [...postInfo.images], // 이미지 URL
      title: postInfo.title,
      description: postInfo.description,
      subject: postInfo.subject,
      category: postInfo.category,
      fee: postInfo.fee,
      max_people: postInfo.max_people,
      times_per_week: postInfo.times_per_week,
      participants: [userId],
    };

    try {
      const { data: challengePost, error: challengeError } = await supabase
        .from("challenge_posts")
        .insert([post])
        .select();
      if (challengeError) throw new Error("챌린지 업로드 에러", challengeError);

      const postId = challengePost[0].id;

      // 유저 정보 가져옴
      const { data: userData, error: userError } = await supabase
        .from("userinfo")
        .select("posts")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      const currentPosts = userData.posts || [];

      const updatePosts = [...currentPosts, { id: postId, type: "challenge_posts" }];

      // 유저 정보 업데이트
      const updateResponse = await supabase.from("userinfo").update({ posts: updatePosts }).eq("id", userId).select();
      console.log("updateResponse", updateResponse);

      return challengePost;
    } catch (error) {
      console.error(error);
    }
  };

  const updateChallengePost = async (newPostInfo, postId) => {
    try {
      const { data: updateData, error: updateError } = await supabase
        .from("challenge_posts")
        .update(newPostInfo)
        .eq("id", postId)
        .select();
      console.log(updateData);
      return updateData;
    } catch (error) {
      console.error(error);
    }
  };

  // 라운지 게시글
  const createLoungePost = async (postInfo, userId) => {
    try {
      const {
        data: createData,
        error: createError,
        status: createStatus,
      } = await supabase.from("lounge_posts").insert([postInfo]).select();
      console.log("생성 데이터", createData);

      if (createError && createStatus !== 201) {
        throw createError;
      }

      const postId = createData[0].id;

      // 유저 정보 가져옴
      const { data: userData, error: userError } = await supabase
        .from("userinfo")
        .select("posts")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      const currentPosts = userData.posts || [];

      const updatePosts = [...currentPosts, { id: postId, type: "lounge_posts" }];

      // 유저 정보 업데이트
      const updateResponse = await supabase.from("userinfo").update({ posts: updatePosts }).eq("id", userId).select();
      console.log("updateResponse", updateResponse);

      return createData;
    } catch (error) {
      console.error(error);
    }
  };

  const loadLoungePosts = async () => {
    try {
      const { data, error } = await supabase.from("lounge_posts").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error(error);
      }
      console.log(data);
      loungePosts.value = data;
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  const deleteLoungePost = async (postId) => {
    try {
      const response = await supabase.from("lounge_posts").delete().eq("id", postId).select();

      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };

  const getLoungePostIndexById = (postId) => {
    return loungePosts.value.findIndex((post) => post.id === postId);
  };

  const updateLoungePosts = async (postId, updates) => {
    const index = getLoungePostIndexById(postId);
    //반응형으로 복사히지 않기 위해//useNonReactiveCopy훅으로 빼기
    const oldPost = JSON.parse(JSON.stringify(loungePosts.value[index]));

    Object.assign(loungePosts.value[index], updates);

    const { error } = await supabase.from("lounge_posts").update(updates).eq("id", postId).select();
    if (error) {
      console.log("failed to update", error);
      Object.assign(loungePosts.value[index], oldPost);
    }
  };

  // 소셜링
  const loadSocialPosts = async () => {
    try {
      const { data: socialData, error: socialError } = await supabase.from("socialing_posts").select();
      console.log("소셜링 게시글 정보", socialData);
      socialingPosts.value = socialData;
      console.log(socialingPosts.value);
    } catch (error) {
      console.error("loadSocialData error");
    }
  };

  const createSocialPost = async (postInfo, userId) => {
    console.log(postInfo.time);
    const post = {
      age_limit: Array.from(postInfo.age_limit) || [], // Proxy(Array) -> 일반 배열
      fee_info: Array.from(postInfo.fee_info) || [], // Proxy(Array) -> 일반 배열
      time: JSON.stringify({ ...postInfo.time }) || {}, // Proxy(Object) -> 일반 객체
      date: new Date(postInfo.date).toISOString().split("T")[0], // 날짜 포맷 변경
      images: [...postInfo.images], // 이미지 URL
      title: postInfo.title,
      description: postInfo.description,
      subject: postInfo.subject,
      category: postInfo.category,
      fee: postInfo.fee,
      gender: postInfo.gender,
      max_people: postInfo.max_people,
      place: typeof postInfo.place === "string" ? postInfo.place : JSON.stringify({ ...postInfo.place }),
      type: postInfo.type,
      participants: [userId],
    };

    try {
      const { data: socialPost, error: socialError } = await supabase.from("socialing_posts").insert([post]).select();
      console.log(socialPost);
      if (socialError) throw new Error("소셜링 업로드 에러", socialError);

      const postId = socialPost[0].id;

      // 유저 정보 가져옴
      const { data: userData, error: userError } = await supabase
        .from("userinfo")
        .select("posts")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      const currentPosts = userData.posts || [];

      const updatePosts = [...currentPosts, { id: postId, type: "socialing_posts" }];

      // 유저 정보 업데이트
      const updateResponse = await supabase.from("userinfo").update({ posts: updatePosts }).eq("id", userId).select();
      console.log("updateResponse", updateResponse);

      return socialPost;
    } catch (error) {
      console.error(error);
    }
  };

  const deleteSocialPost = async (postId, userId) => {
    try {
      // 소셜 포스트 테이블에서 삭제
      const { error: deleteError } = await supabase.from("socialing_posts").delete().eq("id", postId);
      if (deleteError) {
        console.log("Failed to delete social post", deleteError);
        return;
      }

      // userinfo 테이블에서 해당 사용자의 posts 가져오기
      const { data: userInfoData, error: userInfoError } = await supabase
        .from("userinfo")
        .select("posts")
        .eq("id", userId)
        .single();

      if (userInfoError) {
        console.log("Failed to fetch userinfo data", userInfoError);
        return;
      }

      // 해당 postId 삭제
      const updatedPosts = userInfoData.posts.filter((post) => {
        const postObj = JSON.parse(post); // JSON 문자열을 객체로 변환
        return postObj.id !== postId; // 해당 postId와 일치하는 항목을 제외
      });

      // 필터링한 새로운 posts 배열로 업데이트
      const { error: updateError } = await supabase.from("userinfo").update({ posts: updatedPosts }).eq("id", userId);

      if (updateError) {
        console.log("Failed to update userinfo", updateError);
        return;
      }
    } catch (error) {
      console.error("Failed to delete social post", error);
    }
  };

  const updateSocialPost = async (newPostInfo, postId) => {
    try {
      const { data: updateData, error: updateError } = await supabase
        .from("socialing_posts")
        .update(newPostInfo)
        .eq("id", postId)
        .select();
      console.log(updateData);
      return updateData;
    } catch (error) {
      console.error(error);
    }
  };

  return {
    clubPosts,
    loadClubPosts,
    createClubPost,
    deleteClubPost,
    updateClubPost,

    challengePosts,
    loadChallengePosts,
    createChallengePost,
    deleteChallengePost,
    updateChallengePost,

    loungePosts,
    createLoungePost,
    loadLoungePosts,
    deleteLoungePost,
    updateLoungePosts,

    socialingPosts,
    loadSocialPosts,
    createSocialPost,
    deleteSocialPost,
    updateSocialPost,
  };
});
