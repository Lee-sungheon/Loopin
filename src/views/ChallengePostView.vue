<script setup>
import MemberInfo from "@/components/postcontent/MemberInfo.vue";
import Comment from "@/components/postcontent/Comment.vue";
import Register from "@/components/postcontent/Register.vue";
import { joinChallenge } from "@/utils/joinChallenge";
import { usePostStore } from "@/stores/postStore";
import { storeToRefs } from "pinia";
import supabase from "@/config/supabase";
import { ref, computed, onBeforeMount, onMounted, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import Loading from "@/components/Loading.vue";
import MoreModal from "@/components/lounge/MoreModal.vue";
import { resizeImage } from "@/utils/resizeImage";

const postStore = usePostStore();
const { challengePosts } = storeToRefs(postStore);
const { loadChallengePosts } = postStore;

const router = useRouter();
const route = useRoute();
const postId = route.params.id;

const userData = ref(null);
const userId = ref("");
const isLoading = ref(false);

const isModalOpen = ref(false);

const getUserId = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  console.log("내 아이디: ", sessionData?.session?.user?.id);
  userId.value = sessionData?.session?.user?.id || "";
};

const currentPost = computed(() => {
  return challengePosts.value.find((post) => post.id === postId);
});

const fetchData = async () => {
  isLoading.value = true;
  if (currentPost.value && currentPost.value.creator) {
    try {
      // Supabase에서 작성자 정보 가져오기
      const { data: userDataFromDB, error: userError } = await supabase
        .from("userinfo")
        .select()
        .eq("id", currentPost.value.creator)
        .single();

      if (userError) {
        console.log("유저 데이터를 가져오는 중 에러 발생", userError);
        return;
      }

      if (userDataFromDB) {
        userData.value = userDataFromDB;
        resizeProfile();
      }
    } catch (error) {
      console.log("알 수 없는 오류 발생: ", error);
    } finally {
      isLoading.value = false;
    }
  } else {
    console.log("작성자 ID가 없습니다.");
  }
};

const handleUpdateParticipants = (updatedParticipants) => {
  currentPost.value.participants = updatedParticipants;
};

onMounted(async () => {
  console.log("현재 게시글", currentPost.value);
  await getUserId();
});

// currentPost가 변경될 때마다 자동으로 실행
watchEffect(() => {
  if (currentPost.value && currentPost.value?.creator) {
    fetchData();
  }
});

onBeforeMount(() => {
  loadChallengePosts();
});

const formattedDate = (dateString) => {
  const [_, month, day] = dateString.split("-");

  const date = new Date(dateString);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const dayOfWeek = weekdays[date.getDay()];

  const formattedMonth = month.padStart(2, "0");
  const formattedDay = day.padStart(2, "0");

  return `${formattedMonth}.${formattedDay}(${dayOfWeek})`;
};
const startDate = computed(() => {
  return formattedDate(currentPost.value.start_date);
});

const endDate = computed(() => {
  return formattedDate(currentPost.value.end_date);
});

const period = computed(() => {
  const start = new Date(currentPost.value.start_date);
  const end = new Date(currentPost.value.end_date);

  return (end - start) / (1000 * 60 * 60 * 24) + 1;
});
const openModal = () => {
  isModalOpen.value = true;
};

//프로필 이미지 리사이즈
const resizedProfile = ref(null);
const resizeProfile = () => {
  const img = new Image();
  img.crossOrigin = "anonymous"; // CORS 설정 추가
  img.onload = () => {
    // 리사이징된 이미지 URL 얻기
    resizedProfile.value = resizeImage(img, 200, 200);
  };
  // 외부 URL에서 이미지 로드
  img.src = userData.value.profile_img;
};

const formatFeeInfo = (fee) => {
  switch (fee) {
    case "contentFee":
      return "콘텐츠 제작비";
    case "hostFee":
      return "호스트 수고비";
    case "noshowFee":
      return "노쇼 방지비";
    case "rentalFee":
      return "대관료";
    case "materialFee":
      return "재료비";
    case "dessertFee":
      return "다과비";
  }
};
</script>
<template>
  <MoreModal :isModalOpen="isModalOpen" :postId="postId" @close="isModalOpen = false" />
  <Loading v-if="isLoading" />
  <div v-if="currentPost" class="mx-auto w-[600px] relative">
    <img
      class="w-full h-[260px] object-cover will-change-transform"
      :src="currentPost.images ? currentPost.images[0] : ' '"
      alt="thumbnail"
    />
    <div class="absolute top-3 left-3 flex gap-2">
      <div class="text-[14px] rounded-[16px] bg-[#D9D9D9] px-2 py-1">{{ currentPost.category }}</div>
    </div>
    <div v-if="userData" class="bg-white w-[440px] h-[105px] top-[205px] left-[80px] absolute rounded-[20px]">
      <img
        v-if="resizedProfile"
        @click="router.push(`/user/${userData.nickname}`)"
        :src="resizedProfile"
        alt="hostprofile"
        class="w-[60px] h-[60px] rounded-full absolute left-[190px] top-[-30px] object-cover will-change-transform cursor-pointer"
      />
      <img
        v-else
        @click="router.push(`/user/${userData.nickname}`)"
        src="@/assets/images/no-profile.svg"
        alt="hostprofile"
        class="w-[60px] h-[60px] rounded-full absolute left-[190px] top-[-30px] cursor-pointer"
      />
      <div class="text-center mt-[30px]">
        <p class="text-[12px] mb-1">{{ userData.nickname }}</p>
        <p class="text-[20px] font-bold">{{ currentPost.title }}</p>
      </div>
    </div>
    <div class="flex items-center gap-2 absolute right-[40px]">
      <button v-if="currentPost.creator === userId" @click="openModal"><img src="@/assets/images/more-black.svg" alt="더보기" /></button>
    </div>
    <!-- 한줄 요약 -->
    <div class="bg-[#f1f1f1] min-h-screen pb-[120px]">
      <div class="pt-[50px]">
        <div class="text-center text-[#403F3F] mt-2">
          <img src="@/assets/images/calendar.svg" alt="calendar" class="inline-block" />
          <span class="mr-2">{{ startDate }} {{ period / 7 }}주 간</span>
          <img
            src="@/assets/images/check-circle.svg"
            alt="check"
            class="inline-block mb-[2px] mr-1"
            style="filter: invert(23%) sepia(15%) saturate(21%) hue-rotate(83deg) brightness(101%) contrast(97%)"
          />
          <span class="mr-2">{{ currentPost.times_per_week }}</span>
          <img
            src="@/assets/images/members.svg"
            alt="membercount"
            class="inline-block mb-[2px] mr-1"
            style="filter: invert(23%) sepia(15%) saturate(21%) hue-rotate(83deg) brightness(101%) contrast(97%)"
          />
          <span>{{ currentPost.participants ? currentPost.participants.length : 1 }}/{{ currentPost.max_people }}</span>
        </div>
        <div class="ml-[40px] mt-[70px] w-[520px]">
          <div>{{ currentPost.description }}</div>
          <!-- 멤버 소개 -->
          <MemberInfo :participants="currentPost.participants || []" :pageType="'challenge'" />
          <!-- 안내사항 -->
          <div class="mt-5">
            <div class="text-[#46A7CD]">안내사항</div>
            <div class="font-bold">자세한 정보를 알려드릴게요</div>
            <div class="mt-2">
              <div class="flex gap-1 mb-1">
                <img src="@/assets/images/category.svg" alt="category" />

                <router-link to="#" class="underline">{{ currentPost.subject }}</router-link>
                <span v-if="currentPost.subject"> > </span>
                <router-link to="#" class="underline">{{ currentPost.category }}</router-link>
              </div>
              <div class="flex gap-1 mb-1">
                <img src="@/assets/images/members.svg" alt="members" />
                <p>
                  {{ currentPost.participants ? currentPost.participants.length : 1 }}/{{ currentPost.max_people }}명
                  선착순
                </p>
              </div>
              <div v-if="currentPost.fee !== 0" class="flex gap-1 mb-1">
                <img src="@/assets/images/won.svg" alt="fee" />
                <p>{{ currentPost.fee }}원</p>
              </div>
              <div v-if="currentPost.fee_info.length > 0" class="flex gap-1 mb-1">
                <img src="@/assets/images/info-circle.svg" alt="feeinfo" />
                <span v-for="(info, index) in currentPost.fee_info" :key="index">{{ formatFeeInfo(info) }}</span>
              </div>
              <div class="flex gap-1 mb-1">
                <img src="@/assets/images/calendar.svg" alt="calendar" />
                <p>{{ period / 7 }}주 간 진행 - {{ startDate }} ~ {{ endDate }}</p>
              </div>
              <div class="flex gap-1 mb-1">
                <img src="@/assets/images/stamp.svg" alt="stamp" class="mb-[2px]" />
                <p>{{ currentPost.times_per_week }} 인증</p>
              </div>
            </div>
          </div>
          <!-- 댓글 -->
          <Comment :likes="currentPost.likes" :comments="currentPost.comments" :pageType="'challenge'" />
        </div>
      </div>
      <!-- 참여하기 -->
      <Register
        :title="currentPost.title"
        :currentPost="currentPost"
        :pageType="'challenge'"
        :userId="userId"
        :action="joinChallenge"
        @updateParticipants="handleUpdateParticipants"
      />
    </div>
  </div>
</template>
<style scoped></style>
