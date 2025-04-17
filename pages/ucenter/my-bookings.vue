<template>
  <view class="container">
    <!-- 状态切换 -->
    <view class="status-tabs">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'current' }"
        @click="switchTab('current')"
      >
        当前预约
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'history' }"
        @click="switchTab('history')"
      >
        历史预约
      </view>
    </view>

    <!-- 预约列表 -->
    <view class="booking-list" v-if="bookings.length > 0">
      <view
        class="booking-item"
        v-for="booking in bookings"
        :key="booking._id"
        @click="viewBookingDetail(booking._id)"
      >
        <!-- 预约状态 -->
        <view class="booking-status" :class="getStatusClass(booking.status)">
          {{ getStatusText(booking.status) }}
        </view>

        <!-- 场地信息 -->
        <view class="venue-info">
          <text class="venue-name">{{ booking.venueName }}</text>
          <text class="booking-type">{{
            getBookingTypeText(booking.type, booking.halfCourt)
          }}</text>
        </view>

        <!-- 预约时间 -->
        <view class="booking-time">
          <text class="date">{{ formatDate(booking.date) }}</text>
          <text class="time"
            >{{ booking.startTime }} - {{ booking.endTime }}</text
          >
        </view>

        <!-- 联系信息 -->
        <view class="contact-info">
          <text class="contact-label">联系人：</text>
          <text class="contact-value">{{ "梁老师" }}</text>
        </view>
        <view class="contact-info">
          <text class="contact-label">联系电话：</text>
          <text class="contact-value">{{ "18692535677" }}</text>
        </view>

        <!-- 操作按钮 -->
        <view
          class="action-buttons"
          v-if="
            (booking.status === 'pending' || booking.status === 'confirmed') &&
            activeTab === 'current'
          "
        >
          <button
            class="action-btn cancel-btn"
            @click.stop="cancelBooking(booking)"
          >
            取消预约
          </button>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <image
        src="/static/empty.png"
        mode="aspectFit"
        class="empty-image"
      ></image>
      <text class="empty-text">{{
        activeTab === "current" ? "暂无当前预约" : "暂无历史预约"
      }}</text>
    </view>

    <!-- 加载更多 -->
    <uni-load-more :status="loadMoreStatus" />

    <!-- 调试按钮 -->
    <view class="debug-section">
      <button class="debug-btn" @click="checkBookings">检查预约记录</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { store } from "@/uni_modules/uni-id-pages/common/store.js";

const activeTab = ref("current");
const bookings = ref([]);
const page = ref(1);
const pageSize = ref(10);
const hasMore = ref(true);
const loadMoreStatus = ref("more");

// 切换标签
const switchTab = (tab) => {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  page.value = 1;
  bookings.value = [];
  hasMore.value = true;
  loadMoreStatus.value = "more";
  fetchBookings();
};

// 获取预约列表
const fetchBookings = async () => {
  if (!store.hasLogin) {
    uni.showToast({
      title: "请先登录",
      icon: "none",
    });
    return;
  }

  if (loadMoreStatus.value === "loading") return;
  loadMoreStatus.value = "loading";

  try {
    console.log("开始获取预约列表，参数：", {
      userId: store.userInfo._id,
      status: "confirmed", // 获取所有已确认的预约
      page: page.value,
      pageSize: pageSize.value,
    });

    const { result } = await uniCloud.callFunction({
      name: "venue_booking_list",
      data: {
        userId: store.userInfo._id,
        status: "confirmed", // 获取所有已确认的预约
        page: page.value,
        pageSize: pageSize.value,
      },
    });

    console.log("获取预约列表结果：", result);

    if (result.code === 0) {
      const allBookings = result.data.list;
      console.log("所有预约列表：", allBookings);

      // 根据当前时间和预约时间区分当前预约和历史预约
      const now = new Date();
      const currentBookings = [];
      const historyBookings = [];

      allBookings.forEach((booking) => {
        // 解析预约日期和时间
        const bookingDate = new Date(booking.date);
        const [hours, minutes] = booking.endTime.split(":").map(Number);
        bookingDate.setHours(hours, minutes, 0, 0);

        // 如果预约结束时间已经过去，则为历史预约
        if (bookingDate < now) {
          historyBookings.push(booking);
        } else {
          currentBookings.push(booking);
        }
      });

      // 根据当前选中的标签显示相应的预约列表
      const newBookings =
        activeTab.value === "current" ? currentBookings : historyBookings;
      console.log("筛选后的预约列表：", newBookings);

      if (page.value === 1) {
        bookings.value = newBookings;
      } else {
        bookings.value = [...bookings.value, ...newBookings];
      }

      console.log("更新后的预约列表：", bookings.value);

      hasMore.value = newBookings.length === pageSize.value;
      loadMoreStatus.value = hasMore.value ? "more" : "noMore";
    } else {
      uni.showToast({
        title: result.msg || "获取预约列表失败",
        icon: "none",
      });
      loadMoreStatus.value = "more";
    }
  } catch (e) {
    console.error("获取预约列表失败：", e);
    uni.showToast({
      title: "获取预约列表失败",
      icon: "none",
    });
    loadMoreStatus.value = "more";
  }
};

// 检查预约记录
const checkBookings = async () => {
  if (!store.hasLogin) {
    uni.showToast({
      title: "请先登录",
      icon: "none",
    });
    return;
  }

  try {
    console.log("开始检查预约记录，参数：", {
      userId: store.userInfo._id,
    });

    const { result } = await uniCloud.callFunction({
      name: "venue_check_bookings",
      data: {
        userId: store.userInfo._id,
      },
    });

    console.log("检查预约记录结果：", result);

    if (result.code === 0) {
      const { allBookings, currentBookings, historyBookings } = result.data;

      console.log("所有预约记录：", allBookings);
      console.log("当前预约记录：", currentBookings);
      console.log("历史预约记录：", historyBookings);

      // 显示结果
      uni.showModal({
        title: "检查结果",
        content: `所有预约：${allBookings.length}条\n当前预约：${currentBookings.length}条\n历史预约：${historyBookings.length}条`,
        showCancel: false,
      });
    } else {
      uni.showToast({
        title: result.msg || "检查预约记录失败",
        icon: "none",
      });
    }
  } catch (e) {
    console.error("检查预约记录失败：", e);
    uni.showToast({
      title: "检查预约记录失败",
      icon: "none",
    });
  }
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: "待确认",
    confirmed: "已确认",
    cancelled: "已取消",
    completed: "已完成",
  };

  // 如果是历史预约，显示"已完成"
  if (activeTab.value === "history") {
    return "已完成";
  }

  return statusMap[status] || status;
};

// 获取状态样式类
const getStatusClass = (status) => {
  const classMap = {
    pending: "status-pending",
    confirmed: "status-confirmed",
    cancelled: "status-cancelled",
    completed: "status-completed",
  };

  // 如果是历史预约，使用"已完成"的样式
  if (activeTab.value === "history") {
    return "status-completed";
  }

  return classMap[status] || "";
};

// 获取预约类型文本
const getBookingTypeText = (type, halfCourt) => {
  if (type === "full") {
    return "全场";
  } else if (type === "half") {
    return halfCourt === "half_a" ? "半场A" : "半场B";
  }
  return type;
};

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}年${month}月${day}日`;
};

// 查看预约详情
const viewBookingDetail = (bookingId) => {
  uni.navigateTo({
    url: `/pages/ucenter/booking-detail?id=${bookingId}`,
  });
};

// 取消预约
const cancelBooking = (booking) => {
  uni.showModal({
    title: "提示",
    content: "确定要取消此预约吗？",
    success: async (res) => {
      if (res.confirm) {
        try {
          const { result } = await uniCloud.callFunction({
            name: "venue_book",
            data: {
              type: "cancel",
              bookingId: booking._id,
              userId: store.userInfo._id,
            },
          });

          if (result.code === 0) {
            uni.showToast({
              title: "取消预约成功",
              icon: "success",
            });
            // 刷新预约列表
            page.value = 1;
            fetchBookings();
          } else {
            uni.showToast({
              title: result.msg || "取消预约失败",
              icon: "none",
            });
          }
        } catch (e) {
          console.error(e);
          uni.showToast({
            title: "取消预约失败",
            icon: "none",
          });
        }
      }
    },
  });
};

// 监听页面触底
const onReachBottom = () => {
  if (hasMore.value) {
    page.value++;
    fetchBookings();
  }
};

onMounted(() => {
  fetchBookings();
});
</script>

<style>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.status-tabs {
  display: flex;
  background-color: #ffffff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 30rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #1890ff;
  font-weight: bold;
}

.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background-color: #1890ff;
  border-radius: 2rpx;
}

.booking-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.booking-item {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.booking-status {
  display: inline-block;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  margin-bottom: 16rpx;
}

.status-pending {
  background-color: #fff7e6;
  color: #fa8c16;
}

.status-confirmed {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-cancelled {
  background-color: #f5f5f5;
  color: #999;
}

.status-completed {
  background-color: #f6ffed;
  color: #52c41a;
}

.venue-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.venue-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.booking-type {
  font-size: 26rpx;
  color: #666;
  background-color: #f5f5f5;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.booking-time {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.date {
  font-size: 28rpx;
  color: #333;
}

.time {
  font-size: 26rpx;
  color: #666;
}

.contact-info {
  display: flex;
  align-items: center;
  font-size: 26rpx;
}

.contact-label {
  color: #999;
}

.contact-value {
  color: #666;
}

.action-buttons {
  margin-top: 20rpx;
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  min-width: 160rpx;
  height: 64rpx;
  line-height: 64rpx;
  text-align: center;
  border-radius: 32rpx;
  font-size: 28rpx;
}

.cancel-btn {
  background-color: #fff1f0;
  color: #f5222d;
}

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

.debug-section {
  margin-top: 40rpx;
  display: flex;
  justify-content: center;
}

.debug-btn {
  background-color: #f0f0f0;
  color: #666;
  font-size: 28rpx;
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
}
</style>
