<template>
  <view class="container">
    <view class="form-container">
      <view class="form-title">发战贴</view>

      <!-- 球队名称 -->
      <view class="form-item">
        <text class="form-label">球队名称</text>
        <input
          class="form-input"
          v-model="teamName"
          placeholder="请输入球队名称"
          maxlength="20"
        />
      </view>

      <!-- 比赛类型 -->
      <view class="form-item">
        <text class="form-label">比赛类型</text>
        <view class="type-selector">
          <view
            class="type-option"
            :class="{ selected: matchType === 'basketball' }"
            @click="selectMatchType('basketball')"
          >
            <text class="type-name">篮球</text>
          </view>
          <view
            class="type-option"
            :class="{ selected: matchType === 'volleyball' }"
            @click="selectMatchType('volleyball')"
          >
            <text class="type-name">气排球</text>
          </view>
        </view>
      </view>

      <!-- 气排球性别选择 -->
      <view class="form-item" v-if="matchType === 'volleyball'">
        <text class="form-label">性别</text>
        <view class="gender-selector">
          <view
            class="gender-option"
            :class="{ selected: gender === 'male' }"
            @click="selectGender('male')"
          >
            <text class="gender-name">男子</text>
          </view>
          <view
            class="gender-option"
            :class="{ selected: gender === 'female' }"
            @click="selectGender('female')"
          >
            <text class="gender-name">女子</text>
          </view>
        </view>
      </view>

      <!-- 场地信息 -->
      <view class="form-item">
        <text class="form-label">场地信息</text>
        <view class="info-display">
          <text class="info-text">{{ venueName || "未选择场地" }}</text>
        </view>
      </view>

      <!-- 时间信息 -->
      <view class="form-item">
        <text class="form-label">比赛时间</text>
        <view class="info-display">
          <text class="info-text">{{
            date ? `${date} ${startTime}-${endTime}` : "未选择时间"
          }}</text>
        </view>
      </view>

      <!-- 比赛邀请 -->
      <view class="form-item">
        <text class="form-label">比赛邀请</text>
        <textarea
          class="form-textarea"
          v-model="invitation"
          placeholder="请输入比赛邀请内容，所有注册了球队的用户都会收到这个邀请"
          maxlength="200"
        />
        <text class="word-count">{{ invitation.length }}/200</text>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <button class="submit-btn" @click="submitMatch">发战贴</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { store } from "@/uni_modules/uni-id-pages/common/store.js";

// 表单数据
const teamName = ref("");
const matchType = ref("basketball"); // 默认选择篮球
const gender = ref("male"); // 默认选择男子
const invitation = ref("");
const venueId = ref("");
const venueName = ref("");
const date = ref("");
const startTime = ref("");
const endTime = ref("");

// 选择比赛类型
const selectMatchType = (type) => {
  matchType.value = type;
};

// 选择性别
const selectGender = (g) => {
  gender.value = g;
};

// 提交比赛
const submitMatch = async () => {
  // 表单验证
  if (!teamName.value.trim()) {
    uni.showToast({
      title: "请输入球队名称",
      icon: "none",
    });
    return;
  }

  if (!invitation.value.trim()) {
    uni.showToast({
      title: "请输入比赛邀请",
      icon: "none",
    });
    return;
  }

  // 检查登录状态
  if (!store.hasLogin) {
    uni.showModal({
      title: "提示",
      content: "请先登录后再发起比赛",
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: "/pages/ucenter/login",
          });
        }
      },
    });
    return;
  }

  try {
    uni.showLoading({
      title: "提交中...",
    });

    // 调用云函数创建比赛
    const { result } = await uniCloud.callFunction({
      name: "match_create",
      data: {
        teamName: teamName.value,
        matchType: matchType.value,
        gender: matchType.value === "volleyball" ? gender.value : "不限",
        invitation: invitation.value,
        venueId: venueId.value,
        venueName: venueName.value,
        date: date.value,
        startTime: startTime.value,
        endTime: endTime.value,
      },
    });

    uni.hideLoading();

    if (result.code === 0) {
      uni.showToast({
        title: "发起成功",
        icon: "success",
      });

      // 跳转到我的比赛页面
      setTimeout(() => {
        uni.redirectTo({
          url: "/pages/match/my",
        });
      }, 1500);
    } else {
      uni.showToast({
        title: result.msg || "发起失败",
        icon: "none",
      });
    }
  } catch (e) {
    uni.hideLoading();
    console.error(e);
    uni.showToast({
      title: "发起失败",
      icon: "none",
    });
  }
};

// 监听页面参数
onLoad((options) => {
  console.log("Received options:", options); // 添加日志
  // 从预约页面传递过来的参数
  if (options.data) {
    try {
      const params = JSON.parse(decodeURIComponent(options.data));
      console.log("Parsed params:", params); // 添加日志
      venueId.value = params.venueId;
      venueName.value = decodeURIComponent(params.venueName);
      date.value = params.date;
      startTime.value = decodeURIComponent(params.startTime);
      endTime.value = decodeURIComponent(params.endTime);
      if (params.teamName) {
        teamName.value = decodeURIComponent(params.teamName);
      }
    } catch (e) {
      console.error("解析参数失败:", e);
      uni.showToast({
        title: "参数解析失败",
        icon: "none",
      });
    }
  }
});
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.form-container {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.form-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  text-align: center;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}

.form-input {
  height: 80rpx;
  padding: 0 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.form-textarea {
  width: 100%;
  height: 200rpx;
  padding: 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.word-count {
  font-size: 24rpx;
  color: #999;
  text-align: right;
  margin-top: 10rpx;
  display: block;
}

.type-selector,
.gender-selector {
  display: flex;
  gap: 20rpx;
}

.type-option,
.gender-option {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;

  &.selected {
    background-color: #007aff;
    color: #fff;
  }
}

.info-display {
  height: 80rpx;
  padding: 0 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  display: flex;
  align-items: center;

  .info-text {
    font-size: 28rpx;
    color: #333;
  }
}

.submit-section {
  margin-top: 50rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background-color: #007aff;
  color: #fff;
  font-size: 32rpx;
  border-radius: 44rpx;
  text-align: center;
}
</style>
