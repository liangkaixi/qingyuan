<template>
  <view class="container">
    <view v-if="venue" class="venue-detail">
      <view class="venue-header">
        <text class="venue-name">{{ venue.name }}</text>
        <text class="venue-address">{{ venue.address }}</text>
        <view class="venue-time">
          <text>营业时间：{{ venue.openTime }} - {{ venue.closeTime }}</text>
        </view>
      </view>

      <view class="booking-section">
        <view class="section-title">预约场地</view>
        <view class="booking-form">
          <view class="form-item">
            <text class="label">预约日期</text>
            <picker
              mode="date"
              :value="selectedDate"
              :start="minDate"
              :end="maxDate"
              @change="onDateChange"
            >
              <view class="picker-value">{{ selectedDate }}</view>
            </picker>
          </view>

          <view class="form-item">
            <text class="label">时间段</text>
            <view class="time-slots">
              <view
                v-for="slot in availableTimeSlots"
                :key="slot.start"
                class="time-slot"
                :class="{ selected: isSlotSelected(slot) }"
                @click="selectTimeSlot(slot)"
              >
                <text
                  >{{ formatTime(slot.start) }} -
                  {{ formatTime(slot.end) }}</text
                >
              </view>
            </view>
          </view>

          <view class="form-item">
            <text class="label">场地类型</text>
            <view class="type-options">
              <view
                v-for="type in venue.availableTypes"
                :key="type"
                class="type-option"
                :class="{ selected: selectedType === type }"
                @click="selectType(type)"
              >
                <text>{{ type === "full" ? "全场" : "半场" }}</text>
              </view>
            </view>
          </view>

          <button
            class="submit-btn"
            @click="submitBooking"
            :disabled="!canSubmit"
          >
            提交预约
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { formatTime } from "@/utils/date";

const venue = ref(null);
const selectedDate = ref("");
const selectedTimeSlot = ref(null);
const selectedType = ref("");
const availableTimeSlots = ref([]);

// 计算最早可预约日期（今天）
const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split("T")[0];
});

// 计算最晚可预约日期（30天后）
const maxDate = computed(() => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split("T")[0];
});

// 是否可以提交预约
const canSubmit = computed(() => {
  return selectedDate.value && selectedTimeSlot.value && selectedType.value;
});

// 获取场馆详情
const getVenueDetail = async (id) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: "venue_detail",
      data: { id },
    });
    if (result.code === 0) {
      venue.value = result.data;
      // 默认选择第一个可用类型
      if (venue.value.availableTypes.length > 0) {
        selectedType.value = venue.value.availableTypes[0];
      }
    } else {
      uni.showToast({
        title: result.msg || "获取场馆详情失败",
        icon: "none",
      });
    }
  } catch (e) {
    console.error(e);
    uni.showToast({
      title: "获取场馆详情失败",
      icon: "none",
    });
  }
};

// 获取可用时间段
const getAvailableTimeSlots = async () => {
  if (!selectedDate.value) return;

  try {
    const { result } = await uniCloud.callFunction({
      name: "venue_available_time",
      data: {
        venueId: venue.value._id,
        date: selectedDate.value,
      },
    });
    if (result.code === 0) {
      availableTimeSlots.value = result.data;
    } else {
      uni.showToast({
        title: result.msg || "获取可用时间段失败",
        icon: "none",
      });
    }
  } catch (e) {
    console.error(e);
    uni.showToast({
      title: "获取可用时间段失败",
      icon: "none",
    });
  }
};

// 日期变化处理
const onDateChange = (e) => {
  selectedDate.value = e.detail.value;
  selectedTimeSlot.value = null;
  getAvailableTimeSlots();
};

// 选择时间段
const selectTimeSlot = (slot) => {
  selectedTimeSlot.value = slot;
};

// 判断时间段是否被选中
const isSlotSelected = (slot) => {
  return (
    selectedTimeSlot.value &&
    slot.start === selectedTimeSlot.value.start &&
    slot.end === selectedTimeSlot.value.end
  );
};

// 选择场地类型
const selectType = (type) => {
  selectedType.value = type;
};

// 提交预约
const submitBooking = async () => {
  if (!canSubmit.value) return;

  try {
    const { result } = await uniCloud.callFunction({
      name: "venue_book",
      data: {
        venueId: venue.value._id,
        type: selectedType.value,
        startTime: selectedTimeSlot.value.start,
        endTime: selectedTimeSlot.value.end,
      },
    });

    if (result.code === 0) {
      uni.showToast({
        title: "预约成功",
        icon: "success",
      });
      // 重置表单
      selectedTimeSlot.value = null;
      // 刷新可用时间段
      getAvailableTimeSlots();
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

onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const venueId = currentPage.options.id;

  if (venueId) {
    getVenueDetail(venueId);
    // 设置默认日期为今天
    selectedDate.value = minDate.value;
  }
});
</script>

<style>
.container {
  padding: 20rpx;
}

.venue-detail {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 20rpx;
}

.venue-header {
  margin-bottom: 30rpx;
}

.venue-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.venue-address {
  font-size: 28rpx;
  color: #666;
  margin-top: 10rpx;
  display: block;
}

.venue-time {
  font-size: 26rpx;
  color: #999;
  margin-top: 10rpx;
}

.booking-section {
  margin-top: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
  display: block;
}

.picker-value {
  background-color: #f5f5f5;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.time-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.time-slot {
  background-color: #f5f5f5;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.time-slot.selected {
  background-color: #007aff;
  color: #ffffff;
}

.type-options {
  display: flex;
  gap: 20rpx;
}

.type-option {
  background-color: #f5f5f5;
  padding: 20rpx 40rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.type-option.selected {
  background-color: #007aff;
  color: #ffffff;
}

.submit-btn {
  background-color: #007aff;
  color: #ffffff;
  margin-top: 40rpx;
}

.submit-btn[disabled] {
  background-color: #cccccc;
}
</style>
