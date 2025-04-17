<template>
  <view class="container">
    <view class="match-detail" v-if="match">
      <!-- 比赛状态 -->
      <view class="match-status" :class="getStatusClass(match.status)">
        {{ getStatusText(match.status) }}
      </view>

      <!-- 球队信息 -->
      <view class="section">
        <view class="section-title">球队信息</view>
        <view class="team-info">
          <text class="team-name">{{ match.teamName }}</text>
          <text class="match-type">{{ getMatchTypeText(match) }}</text>
        </view>
      </view>

      <!-- 比赛时间 -->
      <view class="section">
        <view class="section-title">比赛时间</view>
        <view class="time-info">
          <view class="time-item">
            <text class="time-label">日期：</text>
            <text class="time-value">{{ formatDate(match.date) }}</text>
          </view>
          <view class="time-item">
            <text class="time-label">时间：</text>
            <text class="time-value"
              >{{ match.startTime }} - {{ match.endTime }}</text
            >
          </view>
        </view>
      </view>

      <!-- 比赛邀请 -->
      <view class="section">
        <view class="section-title">比赛邀请</view>
        <view class="invitation-content">
          <text class="invitation-text">{{ match.invitation }}</text>
        </view>
      </view>

      <!-- 报名球队 -->
      <view class="section" v-if="match.teams && match.teams.length > 0">
        <view class="section-title">报名球队</view>
        <view class="teams-list">
          <view
            class="team-item"
            v-for="(team, index) in match.teams"
            :key="index"
          >
            <text class="team-item-name">{{ team.name }}</text>
            <text
              class="team-item-status"
              :class="
                team.status === 'accepted'
                  ? 'status-accepted'
                  : 'status-pending'
              "
            >
              {{ team.status === "accepted" ? "已接受" : "待确认" }}
            </text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons" v-if="isHost">
        <button
          class="action-btn cancel-btn"
          v-if="match.status === 'open'"
          @click="cancelMatch"
        >
          取消比赛
        </button>
      </view>

      <!-- 非主办方操作按钮 -->
      <view class="action-buttons" v-else-if="match.status === 'open'">
        <button class="action-btn join-btn" @click="joinMatch">报名参加</button>
      </view>
    </view>

    <!-- 加载中 -->
    <view class="loading-state" v-else-if="loading">
      <uni-load-more status="loading" />
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <image
        src="/static/empty.png"
        mode="aspectFit"
        class="empty-image"
      ></image>
      <text class="empty-text">比赛不存在或已删除</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { store } from "@/uni_modules/uni-id-pages/common/store.js";

const match = ref(null);
const loading = ref(true);
const matchId = ref("");

// 是否是主办方
const isHost = computed(() => {
  if (!match.value || !store.hasLogin) return false;
  return match.value.userId === store.userInfo._id;
});

// 获取比赛详情
const fetchMatchDetail = async () => {
  if (!store.hasLogin) {
    uni.showToast({
      title: "请先登录",
      icon: "none",
    });
    return;
  }

  loading.value = true;

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
  } finally {
    loading.value = false;
  }
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    open: "开放中",
    closed: "已结束",
    cancelled: "已取消",
  };

  return statusMap[status] || status;
};

// 获取状态样式类
const getStatusClass = (status) => {
  const classMap = {
    open: "status-open",
    closed: "status-closed",
    cancelled: "status-cancelled",
  };

  return classMap[status] || "";
};

// 获取比赛类型文本
const getMatchTypeText = (match) => {
  if (match.matchType === "basketball") {
    return "篮球";
  } else if (match.matchType === "volleyball") {
    return `气排球${match.gender === "male" ? "(男子)" : "(女子)"}`;
  }
  return match.matchType;
};

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}年${month}月${day}日`;
};

// 取消比赛
const cancelMatch = () => {
  uni.showModal({
    title: "提示",
    content: "确定要取消此比赛吗？",
    success: async (res) => {
      if (res.confirm) {
        try {
          const { result } = await uniCloud.callFunction({
            name: "match_cancel",
            data: {
              matchId: matchId.value,
              userId: store.userInfo._id,
            },
          });

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
          console.error(e);
          uni.showToast({
            title: "取消失败",
            icon: "none",
          });
        }
      }
    },
  });
};

// 报名参加
const joinMatch = () => {
  uni.showModal({
    title: "提示",
    content: "确定要报名参加此比赛吗？",
    success: async (res) => {
      if (res.confirm) {
        try {
          const { result } = await uniCloud.callFunction({
            name: "match_join",
            data: {
              matchId: matchId.value,
              userId: store.userInfo._id,
            },
          });

          if (result.code === 0) {
            uni.showToast({
              title: "报名成功",
              icon: "success",
            });
            // 刷新比赛详情
            fetchMatchDetail();
          } else {
            uni.showToast({
              title: result.msg || "报名失败",
              icon: "none",
            });
          }
        } catch (e) {
          console.error(e);
          uni.showToast({
            title: "报名失败",
            icon: "none",
          });
        }
      }
    },
  });
};

onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  matchId.value = currentPage.options.id;

  if (matchId.value) {
    fetchMatchDetail();
  } else {
    loading.value = false;
  }
});
</script>

<style>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.match-detail {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.match-status {
  display: inline-block;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  margin-bottom: 30rpx;
}

.status-open {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-closed {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-cancelled {
  background-color: #f5f5f5;
  color: #999;
}

.section {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1px solid #f0f0f0;
}

.section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.team-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.team-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.match-type {
  font-size: 26rpx;
  color: #666;
  background-color: #f5f5f5;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.time-item {
  display: flex;
  align-items: center;
}

.time-label {
  font-size: 28rpx;
  color: #666;
  width: 100rpx;
}

.time-value {
  font-size: 28rpx;
  color: #333;
}

.invitation-content {
  background-color: #f9f9f9;
  padding: 20rpx;
  border-radius: 8rpx;
}

.invitation-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

.teams-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.team-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
  background-color: #f9f9f9;
  border-radius: 8rpx;
}

.team-item-name {
  font-size: 28rpx;
  color: #333;
}

.team-item-status {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.status-accepted {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-pending {
  background-color: #fff7e6;
  color: #fa8c16;
}

.action-buttons {
  margin-top: 40rpx;
  display: flex;
  justify-content: center;
}

.action-btn {
  min-width: 200rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.cancel-btn {
  background-color: #fff1f0;
  color: #f5222d;
}

.join-btn {
  background-color: #007aff;
  color: #ffffff;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
