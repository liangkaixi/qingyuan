<template>
  <view class="container">
    <!-- 场地基本信息 -->
    <view class="venue-header">
      <swiper
        v-if="venue.images && venue.images.length > 0"
        class="venue-swiper"
        circular
        autoplay
        interval="3000"
        duration="500"
        indicator-dots
        indicator-color="rgba(255, 255, 255, 0.6)"
        indicator-active-color="#ffffff"
      >
        <swiper-item v-for="(image, index) in venue.images" :key="index">
          <image :src="image" class="venue-image" mode="aspectFill" />
        </swiper-item>
      </swiper>

      <view class="venue-info">
        <text class="venue-name">{{ venue.name }}</text>
        <text class="venue-address">{{ venue.address }}</text>
        <view class="venue-price">
          <text class="price-label">价格：</text>
          <text class="price-value">¥{{ venue.price }}/小时</text>
        </view>
        <view class="venue-capacity">
          <text class="capacity-label">容量：</text>
          <text class="capacity-value">{{ venue.capacity }}人</text>
        </view>
        <view class="venue-time">
          <text
            >营业时间：{{ venue.business_hours.start }} -
            {{ venue.business_hours.end }}</text
          >
        </view>
        <view class="venue-facilities">
          <text
            v-for="(facility, index) in venue.facilities"
            :key="index"
            class="facility-tag"
          >
            {{ facility }}
          </text>
        </view>
        <view class="venue-rating">
          <uni-rate :value="venue.rating" size="14" readonly />
          <text class="review-count">({{ venue.review_count }}条评价)</text>
        </view>
      </view>
    </view>

    <!-- 时间选择 -->
    <view class="time-selection">
      <view class="section-title">
        <text>选择时间</text>
      </view>

      <!-- 日期选择 -->
      <view class="date-picker">
        <picker
          mode="date"
          :value="selectedDate"
          :start="minDate"
          :end="maxDate"
          @change="onDateChange"
        >
          <view class="picker-value">
            <text>{{ selectedDate }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>

      <!-- 时间条 -->
      <TimeBar
        :start-time="venue.business_hours.start"
        :end-time="venue.business_hours.end"
        :occupied-times="occupiedTimes"
        :block-width="100"
      />

      <!-- 时间段选择 -->
      <view class="time-slots">
        <view
          v-for="(slot, index) in availableTimeSlots"
          :key="index"
          class="time-slot"
          :class="{ selected: isTimeSlotSelected(slot) }"
          @click="selectTimeSlot(slot)"
        >
          <text class="slot-time">{{ slot.start }} - {{ slot.end }}</text>
          <text class="slot-price">¥{{ venue.price }}</text>
        </view>
      </view>
    </view>

    <!-- 预约按钮 -->
    <view class="booking-button">
      <button
        class="book-btn"
        :disabled="!selectedTimeSlot"
        @click="handleBooking"
      >
        立即预约
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import TimeBar from "@/components/TimeBar.vue";

const venue = ref({});
const selectedDate = ref("");
const selectedTimeSlot = ref(null);
const occupiedTimes = ref([]);

// 获取场地详情
const getVenueDetail = async (venueId) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: "venue_detail",
      data: { venueId },
    });
    if (result.code === 0) {
      venue.value = result.data;
      // 设置默认日期为今天
      const today = new Date();
      selectedDate.value = formatDate(today);
      // 获取占用时间
      getOccupiedTimes(venueId, selectedDate.value);
    } else {
      uni.showToast({
        title: result.msg || "获取场地详情失败",
        icon: "none",
      });
    }
  } catch (e) {
    console.error(e);
    uni.showToast({
      title: "获取场地详情失败",
      icon: "none",
    });
  }
};

// 获取占用时间
const getOccupiedTimes = async (venueId, date) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: "venue_available_time",
      data: { venueId, date },
    });
    if (result.code === 0) {
      occupiedTimes.value = result.data.occupiedTimes || [];
    }
  } catch (e) {
    console.error(e);
  }
};

// 日期选择处理
const onDateChange = (e) => {
  selectedDate.value = e.detail.value;
  getOccupiedTimes(venue.value._id, selectedDate.value);
};

// 选择时间段
const selectTimeSlot = (slot) => {
  selectedTimeSlot.value = slot;
};

// 检查时间段是否被选中
const isTimeSlotSelected = (slot) => {
  return (
    selectedTimeSlot.value &&
    selectedTimeSlot.value.start === slot.start &&
    selectedTimeSlot.value.end === slot.end
  );
};

// 处理预约
const handleBooking = async () => {
  if (!selectedTimeSlot.value) {
    uni.showToast({
      title: "请选择时间段",
      icon: "none",
    });
    return;
  }

  try {
    const { result } = await uniCloud.callFunction({
      name: "venue_book",
      data: {
        venueId: venue.value._id,
        date: selectedDate.value,
        startTime: selectedTimeSlot.value.start,
        endTime: selectedTimeSlot.value.end,
      },
    });

    if (result.code === 0) {
      uni.showToast({
        title: "预约成功",
        icon: "success",
      });
      // 刷新占用时间
      getOccupiedTimes(venue.value._id, selectedDate.value);
    } else {
      uni.showToast({
        title: result.msg || "预约失败",
        icon: "none",
      });
    }
  } catch (e) {
    console.error(e);
    uni.showToast({
      title: "预约失败",
      icon: "none",
    });
  }
};

// 格式化日期为 YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 计算可用时间段
const availableTimeSlots = computed(() => {
  const slots = [];
  const startMinutes = timeToMinutes(
    venue.value.business_hours?.start || "06:00"
  );
  const endMinutes = timeToMinutes(venue.value.business_hours?.end || "22:00");

  for (let minutes = startMinutes; minutes < endMinutes - 60; minutes += 60) {
    const startTime = minutesToTime(minutes);
    const endTime = minutesToTime(minutes + 60);

    // 检查时间段是否被占用
    const isOccupied = occupiedTimes.value.some((period) => {
      const periodStart = timeToMinutes(period.start);
      const periodEnd = timeToMinutes(period.end);
      return minutes >= periodStart && minutes < periodEnd;
    });

    if (!isOccupied) {
      slots.push({ start: startTime, end: endTime });
    }
  }

  return slots;
});

// 将时间字符串转换为分钟数
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// 将分钟数转换为时间字符串
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
};

// 日期范围
const minDate = computed(() => formatDate(new Date()));
const maxDate = computed(() => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return formatDate(date);
});

onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const venueId = currentPage.options.id;

  if (venueId) {
    getVenueDetail(venueId);
  }
});
</script>

<style>
.container {
  padding: 20rpx;
}

.venue-header {
  background-color: #ffffff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 20rpx;
}

.venue-swiper {
  width: 100%;
  height: 400rpx;
}

.venue-image {
  width: 100%;
  height: 100%;
}

.venue-info {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.venue-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.venue-address {
  font-size: 28rpx;
  color: #666;
}

.venue-price,
.venue-capacity {
  font-size: 28rpx;
  color: #333;
}

.price-value,
.capacity-value {
  color: #007aff;
  font-weight: bold;
}

.venue-time {
  font-size: 26rpx;
  color: #999;
}

.venue-facilities {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 10rpx;
}

.facility-tag {
  background-color: #f0f0f0;
  color: #666;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.venue-rating {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 10rpx;
}

.review-count {
  font-size: 24rpx;
  color: #999;
}

.time-selection {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.date-picker {
  margin-bottom: 20rpx;
}

.picker-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.picker-arrow {
  font-size: 24rpx;
  color: #999;
}

.time-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 20rpx;
}

.time-slot {
  width: calc(50% - 10rpx);
  padding: 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.time-slot.selected {
  background-color: #e6f7ff;
  border: 2rpx solid #007aff;
}

.slot-time {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.slot-price {
  font-size: 24rpx;
  color: #007aff;
}

.booking-button {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background-color: #ffffff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.book-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #007aff;
  color: #ffffff;
  font-size: 32rpx;
  border-radius: 40rpx;
  text-align: center;
}

.book-btn[disabled] {
  background-color: #cccccc;
  color: #ffffff;
}
</style>

 