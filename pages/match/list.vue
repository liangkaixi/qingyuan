<template>
  <view class="match-list">
    <!-- 状态切换 -->
    <view class="status-tabs">
      <view
        class="tab-item"
        v-for="tab in tabs"
        :key="tab.value"
        :class="{ active: currentTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 比赛列表 -->
    <view class="match-container" v-if="matches.length > 0">
      <view
        class="match-item"
        v-for="match in matches"
        :key="match._id"
        @click="navigateToDetail(match._id)"
      >
        <view class="match-header">
          <text class="match-time">{{
            formatTime(match.date, match.startTime)
          }}</text>
          <text class="match-status" :class="match.status">{{
            getStatusText(match.status)
          }}</text>
        </view>

        <view class="teams">
          <view class="team home">
            <text class="team-name">{{ match.teamName }}</text>
          </view>

          <view class="vs">VS</view>

          <view class="team away">
            <text class="team-name">{{
              match.teams?.[0]?.name || "待定"
            }}</text>
          </view>
        </view>

        <view class="match-info">
          <view class="venue">
            <uni-icons type="location" size="14" color="#666"></uni-icons>
            <text>{{ match.venueName }}</text>
          </view>
          <view class="type">
            <uni-icons type="info" size="14" color="#666"></uni-icons>
            <text>{{
              match.matchType === "basketball" ? "篮球" : "排球"
            }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <uni-icons type="info" size="50" color="#999"></uni-icons>
      <text>暂无{{ getTabLabel() }}的比赛</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from "vue";

const currentTab = ref("upcoming");
const matches = ref([]);

const tabs = [
  { value: "upcoming", label: "即将开始" },
  { value: "finished", label: "已结束" },
];

const loadMatches = async () => {
  try {
    // 根据当前标签设置对应的状态
    const statusMap = {
      upcoming: "pending", // 将 upcoming 映射为 pending
      finished: "finished",
    };

    const status = statusMap[currentTab.value];
    console.log("发送到云函数的状态:", status);

    const { result } = await uniCloud.callFunction({
      name: "match_list",
      data: {
        status: status,
      },
    });

    console.log("云函数返回数据:", result);

    if (result && result.code === 0) {
      matches.value = result.data.list || [];
      console.log("处理后的比赛列表:", matches.value);
    } else {
      uni.showToast({
        title: result?.msg || "加载失败",
        icon: "none",
      });
    }
  } catch (error) {
    console.error("加载比赛列表失败:", error);
    uni.showToast({
      title: "加载失败",
      icon: "none",
    });
  }
};

// 格式化时间
const formatTime = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split("-");
  const [hour, minute] = timeStr.split(":");
  const date = new Date(year, month - 1, day, hour, minute);
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: "等待接受",
    accepted: "已接受",
    cancelled: "已取消",
    finished: "已结束",
  };
  return statusMap[status] || status;
};

// 获取当前标签文本
const getTabLabel = () => {
  const tab = tabs.find((t) => t.value === currentTab.value);
  return tab ? tab.label : "";
};

// 切换标签
const switchTab = (tab) => {
  currentTab.value = tab;
  loadMatches();
};

// 跳转到比赛详情
const navigateToDetail = (matchId) => {
  uni.navigateTo({
    url: `/pages/match/detail?id=${matchId}`,
  });
};

onMounted(() => {
  loadMatches();
});
</script>

<style lang="scss">
.match-list {
  min-height: 100vh;
  background-color: #f5f5f5;

  .status-tabs {
    display: flex;
    background-color: #ffffff;
    padding: 20rpx;
    position: sticky;
    top: 0;
    z-index: 1;

    .tab-item {
      flex: 1;
      text-align: center;
      font-size: 28rpx;
      color: #666;
      padding: 20rpx 0;
      position: relative;

      &.active {
        color: #007aff;
        font-weight: bold;

        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 40rpx;
          height: 4rpx;
          background-color: #007aff;
          border-radius: 2rpx;
        }
      }
    }
  }

  .match-container {
    padding: 20rpx;

    .match-item {
      background-color: #ffffff;
      border-radius: 12rpx;
      padding: 20rpx;
      margin-bottom: 20rpx;

      .match-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;

        .match-time {
          font-size: 24rpx;
          color: #666;
        }

        .match-status {
          font-size: 24rpx;
          padding: 4rpx 12rpx;
          border-radius: 4rpx;

          &.pending {
            color: #007aff;
            background-color: rgba(0, 122, 255, 0.1);
          }

          &.accepted {
            color: #34c759;
            background-color: rgba(52, 199, 89, 0.1);
          }

          &.cancelled {
            color: #ff3b30;
            background-color: rgba(255, 59, 48, 0.1);
          }

          &.finished {
            color: #999;
            background-color: #f5f5f5;
          }
        }
      }

      .teams {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20rpx;

        .team {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;

          .team-name {
            font-size: 28rpx;
            color: #333;
          }
        }

        .vs {
          font-size: 32rpx;
          color: #999;
          margin: 0 20rpx;
        }
      }

      .match-info {
        display: flex;
        justify-content: space-between;
        font-size: 24rpx;
        color: #666;

        .venue,
        .type {
          display: flex;
          align-items: center;

          .uni-icons {
            margin-right: 6rpx;
          }
        }
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 0;

    text {
      font-size: 28rpx;
      color: #999;
      margin-top: 20rpx;
    }
  }
}
</style>
