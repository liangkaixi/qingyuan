<template>
  <view class="container">
    <view class="match-detail">
      <view class="match-header">
        <text class="match-type">{{ getMatchTypeText(match.matchType) }}</text>
        <text :class="['match-status', getStatusClass(match.status)]">{{
          getStatusText(match.status)
        }}</text>
      </view>

      <view class="match-info">
        <view class="info-row">
          <text class="label">发起球队：</text>
          <text class="value">{{ match.teamName }}</text>
        </view>
        <view class="info-row">
          <text class="label">时间：</text>
          <text class="value"
            >{{ match.date }} {{ match.startTime }}-{{ match.endTime }}</text
          >
        </view>
        <view class="info-row">
          <text class="label">地点：</text>
          <text class="value">{{ match.venueName }}</text>
        </view>
        <view class="info-row">
          <text class="label">邀请：</text>
          <text class="value">{{ match.invitation }}</text>
        </view>
      </view>

      <view v-if="match.teams && match.teams.length > 0" class="teams-section">
        <text class="teams-title">应邀球队：</text>
        <view v-for="team in match.teams" :key="team.userId" class="team-item">
          <text class="team-name">{{ team.name }}</text>
          <text
            :class="[
              'team-status',
              team.status === 'accepted' ? 'accepted' : 'pending',
            ]"
          >
            {{ team.status === "accepted" ? "已应战" : "待确认" }}
          </text>
        </view>
      </view>

      <view class="match-actions">
        <button
          v-if="match.status === 'pending' && isMyMatch"
          class="action-btn cancel"
          @click="cancelMatch"
        >
          取消比赛
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { store } from "@/uni_modules/uni-id-pages/common/store.js";

export default {
  setup() {
    const match = ref({});
    const matchId = ref("");

    const isMyMatch = computed(() => {
      if (!store.hasLogin) return false;
      return match.value.userId === store.userInfo._id;
    });

    const getMatchTypeText = (type) => {
      const types = {
        basketball: "篮球",
        volleyball: "气排球",
      };
      return types[type] || type;
    };

    const getStatusText = (status) => {
      const statusMap = {
        pending: "待应战",
        accepted: "已应战",
        rejected: "已拒绝",
        cancelled: "已取消",
      };
      return statusMap[status] || status;
    };

    const getStatusClass = (status) => {
      const classMap = {
        pending: "status-pending",
        accepted: "status-accepted",
        rejected: "status-rejected",
        cancelled: "status-cancelled",
      };
      return classMap[status] || "";
    };

    const fetchMatchDetail = async () => {
      try {
        const { result } = await uniCloud.callFunction({
          name: "match_detail",
          data: {
            matchId: matchId.value,
          },
        });

        if (result.code === 0) {
          match.value = result.data;
        } else {
          uni.showToast({
            title: result.msg || "获取比赛详情失败",
            icon: "none",
          });
        }
      } catch (e) {
        console.error("获取比赛详情失败：", e);
        uni.showToast({
          title: "获取比赛详情失败",
          icon: "none",
        });
      }
    };

    const cancelMatch = async () => {
      try {
        uni.showLoading({
          title: "取消中...",
        });

        const { result } = await uniCloud.callFunction({
          name: "match_cancel",
          data: {
            matchId: matchId.value,
            userId: store.userInfo._id,
            uniIdToken: uni.getStorageSync("uni_id_token"),
          },
        });

        uni.hideLoading();

        if (result.code === 0) {
          uni.showToast({
            title: "取消成功",
            icon: "success",
          });
          // 刷新比赛详情
          fetchMatchDetail();
        } else {
          uni.showToast({
            title: result.msg || "取消失败",
            icon: "none",
          });
        }
      } catch (e) {
        uni.hideLoading();
        console.error("取消比赛失败：", e);
        uni.showToast({
          title: "取消失败",
          icon: "none",
        });
      }
    };

    onMounted(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      matchId.value = currentPage.options.id;
      fetchMatchDetail();
    });

    return {
      match,
      isMyMatch,
      getMatchTypeText,
      getStatusText,
      getStatusClass,
      cancelMatch,
    };
  },
};
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.match-detail {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;

  .match-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .match-type {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }

    .match-status {
      font-size: 24rpx;
      padding: 4rpx 16rpx;
      border-radius: 20rpx;

      &.status-pending {
        background-color: #ffd591;
        color: #d46b08;
      }

      &.status-accepted {
        background-color: #b7eb8f;
        color: #389e0d;
      }

      &.status-rejected {
        background-color: #ffa39e;
        color: #cf1322;
      }

      &.status-cancelled {
        background-color: #d9d9d9;
        color: #666;
      }
    }
  }

  .match-info {
    .info-row {
      display: flex;
      margin-bottom: 10rpx;

      .label {
        color: #666;
        width: 120rpx;
      }

      .value {
        color: #333;
        flex: 1;
      }
    }
  }

  .teams-section {
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #eee;

    .teams-title {
      font-size: 28rpx;
      color: #666;
      margin-bottom: 10rpx;
    }

    .team-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10rpx 0;

      .team-name {
        font-size: 28rpx;
        color: #333;
      }

      .team-status {
        font-size: 24rpx;
        padding: 4rpx 16rpx;
        border-radius: 20rpx;

        &.accepted {
          background-color: #b7eb8f;
          color: #389e0d;
        }

        &.pending {
          background-color: #ffd591;
          color: #d46b08;
        }
      }
    }
  }

  .match-actions {
    margin-top: 20rpx;
    display: flex;
    justify-content: flex-end;

    .action-btn {
      font-size: 24rpx;
      padding: 6rpx 20rpx;
      border-radius: 20rpx;
      margin-left: 20rpx;

      &.cancel {
        background-color: #ff4d4f;
        color: #fff;
      }
    }
  }
}
</style>
