<template>
  <view class="container">
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

        <!-- 发起球队信息 -->
        <view class="host-team">
          <text class="label">发起球队：</text>
          <text class="name">{{ match.teamName }}</text>
        </view>

        <view class="match-info">
          <view class="venue">
            <uni-icons type="location" size="14" color="#666"></uni-icons>
            <text>{{ match.venueName }}</text>
          </view>
          <view class="type">
            <uni-icons type="info" size="14" color="#666"></uni-icons>
            <text>{{
              match.matchType === "basketball" ? "篮球" : "气排球"
            }}</text>
          </view>
        </view>

        <!-- 已接受球队列表 -->
        <view
          class="accepted-teams"
          v-if="match.teams && match.teams.length > 0"
        >
          <view class="accepted-title">已应战球队：</view>
          <view class="team-list">
            <view
              v-for="team in match.teams"
              :key="team.userId"
              class="team-item"
            >
              <text class="team-name">{{ team.name }}</text>
              <text class="team-contact"
                >联系方式：{{ team.contactPhone }}</text
              >
              <text class="accept-time"
                >接受时间：{{ formatAcceptTime(team.acceptTime) }}</text
              >
            </view>
          </view>
        </view>

        <!-- 接受比赛按钮 -->
        <view class="match-actions" v-if="canAcceptMatch(match)">
          <button class="accept-btn" @click.stop="showAcceptDialog(match)">
            应战
          </button>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <uni-icons type="info" size="50" color="#999"></uni-icons>
      <text>暂无{{ getTabLabel() }}的比赛</text>
    </view>

    <!-- 接受比赛弹窗 -->
    <uni-popup ref="acceptPopup" type="dialog">
      <uni-popup-dialog
        mode="input"
        title="请输入球队名称"
        placeholder="请输入球队名称"
        @confirm="handleTeamNameConfirm"
        @close="closeAcceptDialog"
      ></uni-popup-dialog>
    </uni-popup>

    <uni-popup ref="contactPopup" type="dialog">
      <uni-popup-dialog
        mode="input"
        title="请输入联系方式"
        placeholder="请输入联系电话"
        @confirm="handleContactConfirm"
        @close="closeAcceptDialog"
      ></uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onMounted } from "vue";

const currentTab = ref("upcoming");
const matches = ref([]);
const acceptPopup = ref(null);
const contactPopup = ref(null);
const currentMatch = ref(null);
const acceptForm = ref({
  teamName: "",
  contactPhone: "",
});

const tabs = [
  { value: "upcoming", label: "即将开始" },
  { value: "finished", label: "已结束" },
];

// 检查是否可以接受比赛
const canAcceptMatch = (match) => {
  if (match.status !== "pending") return false;
  if (!match.teams) return true;
  // 如果是气排球，允许多次接受
  if (match.matchType === "volleyball") return true;
  // 篮球比赛最多5个队伍
  return match.teams.length < 5;
};

// 显示接受比赛弹窗
const showAcceptDialog = (match) => {
  currentMatch.value = match;
  acceptForm.value = {
    teamName: "",
    contactPhone: "",
  };
  acceptPopup.value.open();
};

// 处理球队名称确认
const handleTeamNameConfirm = (value) => {
  acceptForm.value.teamName = value;
  acceptPopup.value.close();
  contactPopup.value.open();
};

// 处理联系方式确认
const handleContactConfirm = async (value) => {
  if (!acceptForm.value.teamName || !value) {
    uni.showToast({
      title: "请填写完整信息",
      icon: "none",
    });
    return;
  }

  acceptForm.value.contactPhone = value;
  contactPopup.value.close();

  try {
    const { result } = await uniCloud.callFunction({
      name: "match_accept",
      data: {
        matchId: currentMatch.value._id,
        teamName: acceptForm.value.teamName,
        contactPhone: acceptForm.value.contactPhone,
        matchType: currentMatch.value.matchType,
      },
    });

    if (result.code === 0) {
      uni.showToast({
        title: "接受成功",
        icon: "success",
      });
      loadMatches(); // 重新加载比赛列表
    } else {
      uni.showToast({
        title: result.msg || "接受失败",
        icon: "none",
      });
    }
  } catch (error) {
    console.error("应战失败:", error);
    uni.showToast({
      title: "应战失败",
      icon: "none",
    });
  }
};

// 关闭接受比赛弹窗
const closeAcceptDialog = () => {
  currentMatch.value = null;
  acceptForm.value = {
    teamName: "",
    contactPhone: "",
  };
};

// 加载比赛列表
const loadMatches = async () => {
  try {
    const statusMap = {
      upcoming: "pending",
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

// 格式化接受时间
const formatAcceptTime = (timeStr) => {
  if (!timeStr) return "";
  const date = new Date(timeStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: "等待应战",
    accepted: "已应战",
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

// 跳转到详情页
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
.container {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 20rpx;
}

/* 状态切换样式 */
.status-tabs {
  display: flex;
  background: #ffffff;
  padding: 20rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
  transition: all 0.3s ease;
}

.tab-item.active {
  color: #1a73e8;
  font-weight: 500;
}

.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background: #1a73e8;
  border-radius: 2rpx;
}

/* 比赛列表样式 */
.match-container {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.match-item {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.match-item:active {
  transform: scale(0.98);
  background: #f8f9fa;
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.match-time {
  font-size: 32rpx;
  font-weight: bold;
  color: #1a73e8;
}

.match-status {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}

.match-status.pending {
  background: rgba(255, 152, 0, 0.1);
  color: #f57c00;
}

.match-status.accepted {
  background: rgba(76, 175, 80, 0.1);
  color: #43a047;
}

.match-status.finished {
  background: rgba(158, 158, 158, 0.1);
  color: #757575;
}

.match-status.cancelled {
  background: rgba(244, 67, 54, 0.1);
  color: #e53935;
}

/* 球队信息样式 */
.host-team {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 16rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.host-team .label {
  font-size: 28rpx;
  color: #666;
  margin-right: 12rpx;
}

.host-team .name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.match-info {
  display: flex;
  align-items: center;
  gap: 30rpx;
  margin-bottom: 20rpx;
}

.venue,
.type {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #666;
}

.venue .uni-icons,
.type .uni-icons {
  margin-right: 8rpx;
}

/* 已接受球队样式 */
.accepted-teams {
  margin-top: 20rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.accepted-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 16rpx;
}

.team-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.team-item {
  background: #ffffff;
  padding: 16rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.team-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
  display: block;
}

.team-contact {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 4rpx;
  display: block;
}

.accept-time {
  font-size: 24rpx;
  color: #999;
  display: block;
}

/* 按钮样式 */
.match-actions {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 2rpx solid #f0f0f0;
}

.accept-btn {
  background: linear-gradient(135deg, #1a73e8, #0d47a1);
  color: #ffffff;
  font-size: 28rpx;
  padding: 20rpx 0;
  border-radius: 12rpx;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(26, 115, 232, 0.2);
}

.accept-btn:active {
  transform: scale(0.98);
  background: linear-gradient(135deg, #1557b0, #0a3d8f);
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  color: #999;
  font-size: 28rpx;
}

.empty-state .uni-icons {
  margin-bottom: 20rpx;
}
</style>
