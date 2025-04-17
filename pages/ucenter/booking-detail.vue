<template>
  <view class="container">
    <view class="booking-detail" v-if="booking">
      <!-- 预约状态 -->
      <view class="status-section">
        <text class="status-text" :class="getStatusClass(booking.status)">
          {{ getStatusText(booking.status) }}
        </text>
        <text class="booking-id">预约号：{{ booking._id }}</text>
      </view>
      
      <!-- 场地信息 -->
      <view class="section venue-section">
        <view class="section-title">场地信息</view>
        <view class="venue-info">
          <view class="info-item">
            <text class="info-label">场地名称：</text>
            <text class="info-value">{{ booking.venueName }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">场地地址：</text>
            <text class="info-value">{{ booking.venueAddress }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">场地类型：</text>
            <text class="info-value">{{ getBookingTypeText(booking.type, booking.halfCourt) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 预约时间 -->
      <view class="section time-section">
        <view class="section-title">预约时间</view>
        <view class="time-info">
          <view class="info-item">
            <text class="info-label">预约日期：</text>
            <text class="info-value">{{ formatDate(booking.date) }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">开始时间：</text>
            <text class="info-value">{{ booking.startTime }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">结束时间：</text>
            <text class="info-value">{{ booking.endTime }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">预约时长：</text>
            <text class="info-value">{{ calculateDuration(booking.startTime, booking.endTime) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 联系信息 -->
      <view class="section contact-section">
        <view class="section-title">联系信息</view>
        <view class="contact-info">
          <view class="info-item">
            <text class="info-label">联系人：</text>
            <text class="info-value">{{ booking.userName || '未填写' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">联系电话：</text>
            <text class="info-value">{{ booking.contactPhone || '未填写' }}</text>
          </view>
        </view>
      </view>
      
      <!-- 备注信息 -->
      <view class="section remark-section" v-if="booking.remark">
        <view class="section-title">备注信息</view>
        <view class="remark-content">
          {{ booking.remark }}
        </view>
      </view>
      
      <!-- 预约记录 -->
      <view class="section record-section">
        <view class="section-title">预约记录</view>
        <view class="record-list">
          <view class="record-item">
            <text class="record-time">{{ formatDateTime(booking.create_time) }}</text>
            <text class="record-action">创建预约</text>
          </view>
          <view class="record-item" v-if="booking.confirm_time">
            <text class="record-time">{{ formatDateTime(booking.confirm_time) }}</text>
            <text class="record-action">确认预约</text>
          </view>
          <view class="record-item" v-if="booking.cancel_time">
            <text class="record-time">{{ formatDateTime(booking.cancel_time) }}</text>
            <text class="record-action">取消预约</text>
          </view>
        </view>
      </view>
      
      <!-- 操作按钮 -->
      <view class="action-section" v-if="booking.status === 'pending' || booking.status === 'confirmed'">
        <button class="action-btn cancel-btn" @click="cancelBooking">取消预约</button>
      </view>
    </view>
    
    <!-- 加载中 -->
    <view class="loading" v-else-if="loading">
      <uni-load-more status="loading" />
    </view>
    
    <!-- 错误状态 -->
    <view class="error-state" v-else>
      <image src="/static/error.png" mode="aspectFit" class="error-image"></image>
      <text class="error-text">预约信息不存在或已被删除</text>
      <button class="back-btn" @click="goBack">返回</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { store } from "@/uni_modules/uni-id-pages/common/store.js";

const booking = ref(null);
const loading = ref(true);
const bookingId = ref('');

// 获取预约详情
const fetchBookingDetail = async () => {
  if (!store.hasLogin) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    return;
  }
  
  loading.value = true;
  try {
    const { result } = await uniCloud.callFunction({
      name: 'venue_booking_detail',
      data: {
        bookingId: bookingId.value,
        userId: store.userInfo._id
      }
    });
    
    if (result.code === 0) {
      booking.value = result.data;
    } else {
      uni.showToast({
        title: result.msg || '获取预约详情失败',
        icon: 'none'
      });
    }
  } catch (e) {
    console.error(e);
    uni.showToast({
      title: '获取预约详情失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'pending': '待确认',
    'confirmed': '已确认',
    'cancelled': '已取消',
    'completed': '已完成'
  };
  return statusMap[status] || status;
};

// 获取状态样式类
const getStatusClass = (status) => {
  const classMap = {
    'pending': 'status-pending',
    'confirmed': 'status-confirmed',
    'cancelled': 'status-cancelled',
    'completed': 'status-completed'
  };
  return classMap[status] || '';
};

// 获取预约类型文本
const getBookingTypeText = (type, halfCourt) => {
  if (type === 'full') {
    return '全场';
  } else if (type === 'half') {
    return halfCourt === 'half_a' ? '半场A' : '半场B';
  }
  return type;
};

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};

// 格式化日期时间
const formatDateTime = (dateStr) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 计算时长
const calculateDuration = (startTime, endTime) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (minutes === 0) {
    return `${hours}小时`;
  } else {
    return `${hours}小时${minutes}分钟`;
  }
};

// 将时间字符串转换为分钟数
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// 取消预约
const cancelBooking = () => {
  uni.showModal({
    title: '提示',
    content: '确定要取消此预约吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const { result } = await uniCloud.callFunction({
            name: 'venue_cancel_booking',
            data: {
              bookingId: bookingId.value,
              userId: store.userInfo._id
            }
          });
          
          if (result.code === 0) {
            uni.showToast({
              title: '取消预约成功',
              icon: 'success'
            });
            // 刷新预约详情
            fetchBookingDetail();
          } else {
            uni.showToast({
              title: result.msg || '取消预约失败',
              icon: 'none'
            });
          }
        } catch (e) {
          console.error(e);
          uni.showToast({
            title: '取消预约失败',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

onMounted(() => {
  const currentPage = getCurrentPages().slice(-1)[0];
  bookingId.value = currentPage.options.id;
  fetchBookingDetail();
});
</script>

<style>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.booking-detail {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.status-section {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 30rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.status-text {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.status-pending {
  color: #fa8c16;
}

.status-confirmed {
  color: #1890ff;
}

.status-cancelled {
  color: #999;
}

.status-completed {
  color: #52c41a;
}

.booking-id {
  font-size: 24rpx;
  color: #999;
}

.section {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-bottom: 10rpx;
  border-bottom: 1px solid #f0f0f0;
}

.info-item {
  display: flex;
  margin-bottom: 16rpx;
  font-size: 28rpx;
}

.info-label {
  color: #999;
  width: 160rpx;
}

.info-value {
  color: #333;
  flex: 1;
}

.remark-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  padding: 10rpx 0;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.record-item {
  display: flex;
  justify-content: space-between;
  font-size: 26rpx;
  color: #666;
}

.record-time {
  color: #999;
}

.record-action {
  color: #333;
  font-weight: bold;
}

.action-section {
  margin-top: 20rpx;
  padding: 0 20rpx;
}

.action-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.cancel-btn {
  background-color: #fff1f0;
  color: #f5222d;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300rpx;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.error-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 20rpx;
}

.error-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 30rpx;
}

.back-btn {
  width: 200rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background-color: #f5f5f5;
  color: #666;
  border-radius: 40rpx;
  font-size: 28rpx;
}
</style> 