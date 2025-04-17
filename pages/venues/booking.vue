<template>
  <view class="container">
    <!-- 场地轮播图 -->
    <swiper
      v-if="venue && venue.images && venue.images.length > 0"
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

    <!-- 场地信息 -->
    <view class="venue-info" v-if="venue">
      <text class="venue-name">{{ venue.name }}</text>
      <text class="venue-address">{{ venue.address }}</text>
      <view class="venue-price">
        <text class="price-label">价格：</text>
        <text class="price-value">¥{{ venue.price }}/小时</text>
      </view>
    </view>

    <!-- 预约表单 -->
    <view class="booking-form">
      <!-- 场地类型选择 -->
      <view class="form-item">
        <text class="form-label">场地类型</text>
        <view class="venue-types">
          <view
            v-for="(type, index) in venueTypes"
            :key="index"
            class="venue-type"
            :class="{ selected: selectedType === type.value }"
            @click="selectType(type.value)"
          >
            <text class="type-name">{{ type.label }}</text>
            <text class="type-price">¥{{ type.price }}/小时</text>
          </view>
        </view>
      </view>

      <!-- 半场信息提示 -->
      <view
        class="half-court-info"
        v-if="selectedType === 'half' && assignedHalfCourt"
      >
        <text class="info-text"
          >已为您分配{{
            assignedHalfCourt === "half_a" ? "半场A" : "半场B"
          }}</text
        >
      </view>

      <!-- 日期选择 -->
      <view class="form-item" v-if="selectedType">
        <text class="form-label">选择日期</text>
        <view class="date-list">
          <view
            v-for="(date, index) in availableDates"
            :key="index"
            class="date-item"
            :class="{ selected: selectedDate === date.value }"
            @click="selectDate(date.value)"
          >
            <text class="date-day">{{ date.day }}</text>
            <text class="date-text">{{ date.text }}</text>
          </view>
        </view>
      </view>

      <!-- 时间段选择 -->
      <view class="form-item" v-if="selectedDate">
        <!-- 时长选择 -->
        <text class="form-label">选择时长</text>
        <view class="duration-selector">
          <view
            v-for="(duration, index) in availableDurations"
            :key="index"
            class="duration-option"
            :class="{ selected: selectedDuration === duration.value }"
            @click="selectDuration(duration.value)"
          >
            <text class="duration-text">{{ duration.label }}</text>
          </view>
        </view>

        <!-- 开始时间选择 -->
        <text class="form-label" style="margin-top: 20rpx">选择开始时间</text>
        <view class="time-slots">
          <view
            v-for="(slot, index) in timeSlots"
            :key="index"
            class="time-slot"
            :class="[
              selectedTimeSlot && selectedTimeSlot.start === slot.start
                ? 'selected'
                : '',
              !slot.available ? 'disabled' : '',
              !slot.available && slot.occupiedBy === 'full' ? 'full-court' : '',
              !slot.available && slot.occupiedBy === 'half_a'
                ? 'half-court-a'
                : '',
              !slot.available && slot.occupiedBy === 'half_b'
                ? 'half-court-b'
                : '',
            ]"
            :style="!slot.available ? 'pointer-events: none;' : ''"
            @click="selectTimeSlot(slot)"
          >
            <text
              class="time-text"
              :class="{
                'unavailable-text': !slot.available,
                'white-text': !slot.available && slot.occupiedBy,
              }"
            >
              {{ slot.start }}
            </text>
            <text v-if="!slot.available" class="occupied-text">
              {{ getOccupiedText(slot) }}
            </text>
          </view>
        </view>
        <!-- 图例说明 -->
        <view class="time-legend">
          <view class="legend-item">
            <view class="legend-color available"></view>
            <text class="legend-text">可预约</text>
          </view>
          <view class="legend-item">
            <view class="legend-color full-court"></view>
            <text class="legend-text">全场已预约</text>
          </view>
          <view class="legend-item">
            <view class="legend-color half-court-a"></view>
            <text class="legend-text">半场A已预约</text>
          </view>
          <view class="legend-item">
            <view class="legend-color half-court-b"></view>
            <text class="legend-text">半场B已预约</text>
          </view>
        </view>
        <!-- 选中时间段提示 -->
        <view
          class="selected-time-info"
          v-if="selectedTimeSlot && selectedDuration"
        >
          <text class="info-text"
            >你选择了 {{ selectedTimeSlot.start }} -
            {{ calculateEndTime(selectedTimeSlot.start, selectedDuration) }}（{{
              getDurationLabel(selectedDuration)
            }}）</text
          >
        </view>
      </view>

      <!-- 联系方式 -->
      <view class="form-item">
        <text class="form-label">手机号码</text>
        <input
          class="form-input"
          type="number"
          v-model="contactPhone"
          placeholder="请输入手机号码"
          maxlength="11"
        />
      </view>

      <!-- 备注信息 -->
      <view class="form-item">
        <text class="form-label">备注</text>
        <textarea
          class="form-textarea"
          v-model="remark"
          placeholder="请输入备注信息（选填）"
        />
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button class="submit-btn" @click="submitBooking">提交预约</button>
    </view>
  </view>
</template>
<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { store } from "@/uni_modules/uni-id-pages/common/store.js";

// 格式化日期为 YYYY-MM-DD
const formatDate = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

const venue = ref(null);
const venueId = ref("");
const selectedType = ref("full");
const selectedDate = ref(formatDate(new Date()));
const selectedTimeSlot = ref(null);
const assignedHalfCourt = ref("");
const contactPhone = ref("");
const remark = ref("");
const timeSlots = ref([]);
const loading = ref(false);
const selectedDuration = ref(2); // 默认选择2小时

const venueTypes = [
  { label: "全场", value: "full", price: 0 },
  { label: "半场", value: "half", price: 0 },
];

const availableStartTimes = ref([]);

const availableDates = computed(() => {
  const dates = [];
  const today = new Date();
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      value: formatDate(date),
      day: weekDays[date.getDay()],
      text: `${date.getMonth() + 1}月${date.getDate()}日`,
    });
  }

  return dates;
});

const availableDurations = [
  { label: "1小时", value: 1 },
  { label: "1.5小时", value: 1.5 },
  { label: "2小时", value: 2 },
];

// 计算结束时间
const calculateEndTime = (startTime, duration) => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + duration * 60;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMinutes
    .toString()
    .padStart(2, "0")}`;
};

// 获取时长标签
const getDurationLabel = (duration) => {
  const option = availableDurations.find((d) => d.value === duration);
  return option ? option.label : `${duration}小时`;
};

// 选择时长
const selectDuration = (duration) => {
  selectedDuration.value = duration;
  // 如果已经选择了开始时间，重新计算结束时间
  if (selectedTimeSlot.value) {
    selectedTimeSlot.value = {
      ...selectedTimeSlot.value,
      end: calculateEndTime(selectedTimeSlot.value.start, duration),
      endMinutes: selectedTimeSlot.value.startMinutes + duration * 60,
    };
  }
};

const checkLogin = () => {
  if (!store.hasLogin) {
    uni.showModal({
      title: "提示",
      content: "请先登录后再预约",
      confirmText: "去登录",
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: "/pages/ucenter/login",
          });
        }
      },
    });
    return false;
  }
  return true;
};

const getUserId = () => store.userInfo._id;

const getVenueInfo = async () => {
  try {
    const { result } = await uniCloud.callFunction({
      name: "venue_detail",
      data: { id: venueId.value },
    });

    if (result.code === 0) {
      venue.value = result.data;
      venueTypes[0].price = venue.value.price;
      venueTypes[1].price = venue.value.price / 2;
      if (availableDates.value.length > 0) {
        selectedDate.value = availableDates.value[0].value;
      }
      await getAvailableTimeSlots();
    } else {
      uni.showToast({ title: result.msg || "获取场地信息失败", icon: "none" });
    }
  } catch (e) {
    console.error(e);
    uni.showToast({ title: "获取场地信息失败", icon: "none" });
  }
};

const getOccupiedText = (slot) => {
  if (!slot.occupiedBy) return "已占用";
  if (slot.occupiedBy === "full") return "全场已预约";
  if (slot.occupiedBy === "half_a") return "半场A已预约";
  if (slot.occupiedBy === "half_b") return "半场B已预约";
  return "已占用";
};

const getAvailableTimeSlots = async () => {
  try {
    const slots = generateTimeSlots();
    const { result } = await uniCloud.callFunction({
      name: "venue_available_time",
      data: { venueId: venue.value._id, date: selectedDate.value },
    });

    if (result.code === 0 && result.data.occupiedTimes) {
      const occupiedTimes = result.data.occupiedTimes.map((item) => ({
        startMinutes: timeToMinutes(item.start),
        endMinutes: timeToMinutes(item.end),
        type: item.type,
        halfCourt: item.halfCourt,
      }));

      timeSlots.value = slots.map((slot) => {
        let isOccupied = false;
        let occupiedBy = null;

        // 检查是否在营业时间内
        const isInBusinessHours =
          slot.startMinutes >=
            timeToMinutes(venue.value.business_hours.start) &&
          slot.startMinutes + selectedDuration.value * 60 <=
            timeToMinutes(venue.value.business_hours.end);

        // 检查是否是过去的时间
        const isPastTime = isPastTimeSlot(slot.start);

        // 如果不在营业时间内或是过去的时间，标记为不可用
        if (!isInBusinessHours || isPastTime) {
          isOccupied = true;
          return {
            ...slot,
            available: false,
            occupiedBy: null,
          };
        }

        // 检查是否与已预约时间段重叠
        for (const occupied of occupiedTimes) {
          // 计算当前时间槽的结束时间（基于选择的时长）
          const slotEndMinutes =
            slot.startMinutes + selectedDuration.value * 60;

          // 检查是否有重叠
          const hasOverlap = !(
            slotEndMinutes <= occupied.startMinutes ||
            slot.startMinutes >= occupied.endMinutes
          );

          if (hasOverlap) {
            if (occupied.type === "full") {
              // 全场预约，整个时间段都不可用
              isOccupied = true;
              occupiedBy = "full";
              break;
            } else if (occupied.type === "half") {
              // 半场预约，只有相同半场不可用
              if (
                selectedType.value === "full" ||
                (selectedType.value === "half" &&
                  assignedHalfCourt.value === occupied.halfCourt)
              ) {
                isOccupied = true;
                occupiedBy = occupied.halfCourt;
                break;
              }
            }
          }
        }

        return {
          ...slot,
          available: !isOccupied,
          occupiedBy,
        };
      });
    } else {
      // 如果没有获取到占用时间段，所有时间槽都可用
      timeSlots.value = slots.map((slot) => {
        const isPastTime = isPastTimeSlot(slot.start);
        const isInBusinessHours =
          slot.startMinutes >=
            timeToMinutes(venue.value.business_hours.start) &&
          slot.startMinutes + selectedDuration.value * 60 <=
            timeToMinutes(venue.value.business_hours.end);

        return {
          ...slot,
          available: !isPastTime && isInBusinessHours,
          occupiedBy: null,
        };
      });
    }
  } catch (e) {
    console.error("获取可用时间段失败:", e);
    uni.showToast({ title: "获取可用时间段失败", icon: "none" });
  }
};

const generateTimeSlots = () => {
  const slots = [];
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const isToday = selectedDate.value === formatDate(now);

  for (let hour = 6; hour < 22; hour++) {
    // 如果是今天，跳过已经过去的时间
    if (
      isToday &&
      (hour < currentHour || (hour === currentHour && currentMinutes >= 0))
    ) {
      continue;
    }

    const start = `${hour.toString().padStart(2, "0")}:00`;

    // 检查是否所有可选时长都超出营业时间
    let isValidSlot = false;
    for (const duration of availableDurations) {
      const endMinutes = hour * 60 + duration.value * 60;
      if (endMinutes <= timeToMinutes(venue.value.business_hours.end)) {
        isValidSlot = true;
        break;
      }
    }

    // 如果所有时长都超出营业时间，跳过这个时间段
    if (!isValidSlot) {
      continue;
    }

    slots.push({
      start,
      startMinutes: hour * 60,
    });
  }
  return slots;
};

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const isPastTimeSlot = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const slotTime = new Date();
  slotTime.setHours(hours, minutes, 0, 0);

  // 只有当选择的是今天，且时间段已经过去，才标记为不可用
  const isToday = selectedDate.value === formatDate(now);
  const isPast = isToday && slotTime < now;

  return isPast;
};

const selectType = async (type) => {
  selectedType.value = type;
  selectedTimeSlot.value = null;

  if (type === "half") {
    try {
      const { result } = await uniCloud.callFunction({
        name: "venue_check_half_courts",
        data: { venueId: venueId.value, date: selectedDate.value },
      });

      if (result.code === 0) {
        assignedHalfCourt.value =
          result.data.halfCourtA.occupancy > result.data.halfCourtB.occupancy
            ? "half_b"
            : "half_a";
      }
    } catch (e) {
      console.error(e);
    }
  } else {
    assignedHalfCourt.value = "";
  }

  await getAvailableTimeSlots();
};

const selectDate = async (date) => {
  selectedDate.value = date;
  selectedTimeSlot.value = null;
  await getAvailableTimeSlots();
};

const selectTimeSlot = (slot) => {
  if (!slot.available) {
    uni.showToast({ title: getOccupiedText(slot), icon: "none" });
    return;
  }

  // 使用选择的时长计算结束时间
  const endTime = calculateEndTime(slot.start, selectedDuration.value);
  const endMinutes = slot.startMinutes + selectedDuration.value * 60;

  // 检查结束时间是否超过营业时间
  if (endMinutes > timeToMinutes(venue.value.business_hours.end)) {
    uni.showToast({ title: "所选时间段超出营业时间", icon: "none" });
    return;
  }

  selectedTimeSlot.value = {
    ...slot,
    end: endTime,
    endMinutes: endMinutes,
  };
};

const submitBooking = async () => {
  if (!store.hasLogin) {
    uni.showModal({
      title: "提示",
      content: "请先登录后再预约",
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

  if (!contactPhone.value) {
    uni.showToast({
      title: "请输入手机号码",
      icon: "none",
    });
    return;
  }

  if (!selectedTimeSlot.value) {
    uni.showToast({
      title: "请选择预约时间",
      icon: "none",
    });
    return;
  }

  try {
    loading.value = true;
    const endTime = calculateEndTime(
      selectedTimeSlot.value.start,
      selectedDuration.value
    );

    const { result } = await uniCloud.callFunction({
      name: "venue_book",
      data: {
        venueId: venueId.value,
        date: selectedDate.value,
        startTime: selectedTimeSlot.value.start,
        endTime: endTime,
        type: selectedType.value,
        halfCourt: assignedHalfCourt.value,
        contactPhone: contactPhone.value,
        remark: remark.value,
        userId: store.userInfo._id,
      },
    });

    if (result.code === 0) {
      uni.showToast({
        title: "预约成功",
        icon: "success",
      });
      // 跳转到我的预约列表页面
      setTimeout(() => {
        uni.redirectTo({
          url: "/pages/ucenter/my-bookings",
        });
      }, 1500);
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
  } finally {
    loading.value = false;
  }
};

watch(selectedDate, () => getAvailableTimeSlots());
watch(selectedType, () => getAvailableTimeSlots());
watch(assignedHalfCourt, () => getAvailableTimeSlots());
watch(selectedDuration, () => {
  if (selectedTimeSlot.value) {
    // 重新计算结束时间
    selectedTimeSlot.value = {
      ...selectedTimeSlot.value,
      end: calculateEndTime(
        selectedTimeSlot.value.start,
        selectedDuration.value
      ),
      endMinutes:
        selectedTimeSlot.value.startMinutes + selectedDuration.value * 60,
    };
  }
});

onMounted(async () => {
  const currentPage = getCurrentPages().slice(-1)[0];
  venueId.value = currentPage.options.id;
  await getVenueInfo();
});
</script>

<style>
.container {
  padding: 20rpx;
}

.venue-swiper {
  width: 100%;
  height: 400rpx;
  margin-bottom: 20rpx;
}

.venue-image {
  width: 100%;
  height: 100%;
}

.venue-info {
  background-color: #ffffff;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.venue-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.venue-address {
  font-size: 28rpx;
  color: #666;
  margin: 10rpx 0;
}

.venue-price {
  font-size: 28rpx;
  color: #333;
}

.price-value {
  color: #007aff;
  font-weight: bold;
}

.booking-form {
  background-color: #ffffff;
  padding: 20rpx;
  border-radius: 12rpx;
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

.half-court-info {
  background-color: #e6f7ff;
  padding: 16rpx 20rpx;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.info-text {
  font-size: 28rpx;
  color: #007aff;
}

.date-list {
  display: flex;
  justify-content: space-between;
  gap: 10rpx;
}

.date-item {
  flex: 1;
  height: 120rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10rpx;
}

.date-item.selected {
  background-color: #007aff;
}

.date-item.selected .date-day,
.date-item.selected .date-text {
  color: #ffffff;
}

.date-day {
  font-size: 24rpx;
  color: #666;
}

.date-text {
  font-size: 24rpx;
  color: #333;
  margin-top: 4rpx;
}

.time-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 20rpx;
  width: 100%;
}

.time-slot {
  width: calc(33.33% - 6rpx);
  height: 90rpx;
  background-color: #e6f7ff;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 6rpx;
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
  box-sizing: border-box;
  margin: 0;
  border: 1px solid #bae7ff;
}

.time-slot.selected {
  background-color: #007aff;
  border-color: #007aff;
}

.time-slot.disabled {
  opacity: 0.7;
  background-color: #f5f5f5;
  border-color: #e0e0e0;
}

.time-slot.full-court {
  background-color: #ff6b6b !important;
}

.time-slot.half-court-a {
  background-color: #ffd166 !important;
}

.time-slot.half-court-b {
  background-color: #06d6a0 !important;
}

.time-text {
  font-size: 24rpx;
  color: #007aff;
  transition: color 0.3s ease;
  font-weight: 500;
  text-align: center;
}

.white-text {
  color: #ffffff !important;
}

.unavailable-text {
  color: #999;
}

.occupied-text {
  font-size: 18rpx;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 4rpx;
  padding: 2rpx 4rpx;
  margin-top: 4rpx;
  text-align: center;
  width: 90%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-slot.selected .time-text {
  color: #ffffff;
}

.time-slot.disabled .time-text {
  color: #999;
}

.venue-types {
  display: flex;
  gap: 20rpx;
}

.venue-type {
  flex: 1;
  height: 100rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10rpx;
}

.venue-type.selected {
  background-color: #007aff;
}

.venue-type.selected .type-name,
.venue-type.selected .type-price {
  color: #ffffff;
}

.type-name {
  font-size: 28rpx;
  color: #333;
}

.type-price {
  font-size: 24rpx;
  color: #666;
  margin-top: 4rpx;
}

.submit-section {
  margin-top: 40rpx;
  padding: 0 20rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background-color: #007aff;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 44rpx;
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
  height: 160rpx;
  padding: 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.selected-time-info {
  margin-top: 20rpx;
  padding: 16rpx 20rpx;
  background-color: #e6f7ff;
  border-radius: 8rpx;
}

.info-text {
  font-size: 28rpx;
  color: #007aff;
  font-weight: bold;
}

.time-legend {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20rpx;
  padding: 10rpx;
  background-color: #f9f9f9;
  border-radius: 8rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-right: 20rpx;
  margin-bottom: 10rpx;
}

.legend-color {
  width: 30rpx;
  height: 30rpx;
  border-radius: 4rpx;
  margin-right: 10rpx;
}

.legend-color.available {
  background-color: #e6f7ff;
  border: 1px solid #bae7ff;
}

.legend-color.full-court {
  background-color: #ff6b6b;
}

.legend-color.half-court-a {
  background-color: #ffd166;
}

.legend-color.half-court-b {
  background-color: #06d6a0;
}

.legend-text {
  font-size: 24rpx;
  color: #666;
}

.duration-selector {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.duration-option {
  flex: 1;
  height: 80rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10rpx;
  transition: all 0.3s ease;
}

.duration-option.selected {
  background-color: #007aff;
}

.duration-text {
  font-size: 28rpx;
  color: #333;
  transition: color 0.3s ease;
}

.duration-option.selected .duration-text {
  color: #ffffff;
}
</style>
