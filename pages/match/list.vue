<template>
  <!-- Add your template code here -->
</template>

<script>
import store from "@/store";

export default {
  data() {
    return {
      // Add any necessary component options here
    };
  },
  methods: {
    async submitAcceptMatch() {
      try {
        uni.showLoading({
          title: "提交中...",
        });

        const { result } = await uniCloud.callFunction({
          name: "match_accept",
          data: {
            matchId: this.currentMatch._id,
            teamName: this.teamName,
            contactPhone: this.contactPhone,
            userId: store.userInfo._id,
            uniIdToken: uni.getStorageSync("uni_id_token"),
          },
        });

        uni.hideLoading();

        if (result.code === 0) {
          uni.showToast({
            title: "接受成功",
            icon: "success",
          });
          this.fetchMatches();
        } else {
          uni.showToast({
            title: result.msg || "接受失败",
            icon: "none",
          });
        }
      } catch (error) {
        uni.showToast({
          title: "接受失败",
          icon: "none",
        });
      }
    },
  },
};
</script>

<style>
/* Add your styles here */
</style>
