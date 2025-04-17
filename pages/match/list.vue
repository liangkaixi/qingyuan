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
          <view class="accepted-title">已接受球队：</view>
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
            接受比赛
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
    // 获取用户token和用户信息
    const token = uni.getStorageSync("uni_id_token");
    console.log("获取到的token:", token); // 调试日志

    if (!token) {
      uni.showToast({
        title: "请先登录",
        icon: "none",
      });
      return;
    }

    // 解析token获取用户ID
    try {
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      console.log("解析的token payload:", tokenPayload); // 调试日志
      const userId = tokenPayload.uid;
      if (!userId) {
        uni.showToast({
          title: "用户信息不完整",
          icon: "none",
        });
        return;
      }

      // 获取当前比赛信息
      const match = currentMatch.value;
      if (!match || !match._id) {
        uni.showToast({
          title: "比赛信息不完整",
          icon: "none",
        });
        return;
      }

      // 构建完整的接受比赛参数
      const acceptParams = {
        matchId: match._id,
        teamName: acceptForm.value.teamName,
        contactPhone: acceptForm.value.contactPhone,
        matchType: match.matchType,
        uniIdToken: token,
        userId: userId,
        date: match.date,
        startTime: match.startTime,
        endTime: match.endTime,
        venueId: match.venueId,
        venueName: match.venueName,
        status: "accepted",
        invitation: match.invitation || "接受比赛邀请",
        gender: match.gender || "不限",
        acceptTime: new Date().toISOString(),
      };

      // 检查必需参数是否完整
      const requiredFields = [
        "matchId",
        "teamName",
        "contactPhone",
        "matchType",
        "uniIdToken",
        "userId",
        "date",
        "startTime",
        "endTime",
        "venueId",
        "venueName",
        "status",
        "invitation",
        "gender",
        "acceptTime",
      ];
      const missingFields = requiredFields.filter(
        (field) => !acceptParams[field]
      );

      if (missingFields.length > 0) {
        console.error("缺少必需参数:", missingFields);
        uni.showToast({
          title: `参数不完整: ${missingFields.join(", ")}`,
          icon: "none",
        });
        return;
      }

      console.log("接受比赛参数:", acceptParams);

      const { result: acceptResult } = await uniCloud.callFunction({
        name: "match_accept",
        data: acceptParams,
      });

      if (acceptResult.code === 0) {
        uni.showToast({
          title: "接受成功",
          icon: "success",
        });
        loadMatches(); // 重新加载比赛列表
      } else {
        uni.showToast({
          title: acceptResult.msg || "接受失败",
          icon: "none",
        });
      }
    } catch (tokenError) {
      console.error("解析token失败:", tokenError);
      uni.showToast({
        title: "登录信息无效，请重新登录",
        icon: "none",
      });
    }
  } catch (error) {
    console.error("接受比赛失败:", error);
    uni.showToast({
      title: "接受失败",
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
.match-list {
  padding: 20rpx;

  .status-tabs {
    display: flex;
    margin-bottom: 20rpx;
    background-color: #fff;
    border-radius: 8rpx;
    overflow: hidden;

    .tab-item {
      flex: 1;
      text-align: center;
      padding: 20rpx 0;
      font-size: 28rpx;
      color: #666;
      position: relative;

      &.active {
        color: #007aff;

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
    .match-item {
      background-color: #fff;
      border-radius: 8rpx;
      padding: 20rpx;
      margin-bottom: 20rpx;

      .match-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;

        .match-time {
          font-size: 28rpx;
          color: #333;
        }

        .match-status {
          font-size: 24rpx;
          padding: 4rpx 12rpx;
          border-radius: 4rpx;
          background-color: #f5f5f5;
          color: #666;

          &.pending {
            background-color: #e6f7ff;
            color: #1890ff;
          }

          &.accepted {
            background-color: #f6ffed;
            color: #52c41a;
          }

          &.finished {
            background-color: #f5f5f5;
            color: #999;
          }

          &.cancelled {
            background-color: #fff1f0;
            color: #f5222d;
          }
        }
      }

      .host-team {
        display: flex;
        align-items: center;
        margin-bottom: 20rpx;
        padding: 16rpx;
        background: #f8f8f8;
        border-radius: 8rpx;

        .label {
          font-size: 28rpx;
          color: #666;
          margin-right: 12rpx;
        }

        .name {
          font-size: 28rpx;
          color: #333;
          font-weight: bold;
        }
      }

      .match-info {
        display: flex;
        align-items: center;
        margin-bottom: 20rpx;

        .venue,
        .type {
          display: flex;
          align-items: center;
          margin-right: 30rpx;
          font-size: 24rpx;
          color: #666;

          .uni-icons {
            margin-right: 8rpx;
          }
        }
      }

      .accepted-teams {
        margin-top: 20rpx;
        padding: 20rpx;
        background: #f8f8f8;
        border-radius: 8rpx;

        .accepted-title {
          font-size: 28rpx;
          color: #333;
          margin-bottom: 16rpx;
          font-weight: bold;
        }

        .team-list {
          .team-item {
            background: #fff;
            padding: 16rpx;
            border-radius: 6rpx;
            margin-bottom: 12rpx;

            .team-name {
              font-size: 28rpx;
              color: #333;
              margin-bottom: 8rpx;
              display: block;
              font-weight: bold;
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
          }
        }
      }

      .match-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 20rpx;

        .accept-btn {
          padding: 8rpx 20rpx;
          background-color: #007aff;
          color: #ffffff;
          border-radius: 4rpx;
          border: none;
          font-size: 28rpx;
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
    color: #999;
    font-size: 28rpx;

    .uni-icons {
      margin-bottom: 20rpx;
    }
  }
}
</style>
