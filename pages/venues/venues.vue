<template>
  <view class="container">
    <view class="venue-list">
      <view v-for="(venue, index) in venues" :key="index" class="venue-card">
        <!-- 轮播图 -->
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
          <swiper-item
            v-for="(image, imgIndex) in venue.images"
            :key="imgIndex"
          >
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

          <!-- 今日占用情况 -->
          <view class="occupancy-section">
            <text class="section-title">今日占用状态</text>
            <scroll-view scroll-x="true" class="time-bar">
              <view class="time-blocks">
                <view
                  v-for="hour in businessHours"
                  :key="hour"
                  class="time-block"
                  :class="{
                    'occupied-full': isTimeBlockOccupied(venue, hour, 'full'),
                    'occupied-half-a': isTimeBlockOccupied(
                      venue,
                      hour,
                      'half',
                      'A'
                    ),
                    'occupied-half-b': isTimeBlockOccupied(
                      venue,
                      hour,
                      'half',
                      'B'
                    ),
                  }"
                >
                  <text class="time-text">{{ formatHour(hour) }}</text>
                </view>
              </view>
            </scroll-view>

            <!-- 图例说明 -->
            <view class="legend">
              <view class="legend-item">
                <view class="legend-color available"></view>
                <text>可预约</text>
              </view>
              <view class="legend-item">
                <view class="legend-color occupied-full"></view>
                <text>全场已约</text>
              </view>
              <view class="legend-item">
                <view class="legend-color occupied-half-a"></view>
                <text>半场A已约</text>
              </view>
              <view class="legend-item">
                <view class="legend-color occupied-half-b"></view>
                <text>半场B已约</text>
              </view>
            </view>
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

          <!-- 操作按钮 -->
          <view class="venue-actions">
            <button
              class="action-btn detail-btn"
              @click="goToDetail(venue._id)"
            >
              查看详情
            </button>
            <button class="action-btn book-btn" @click="goToBooking(venue._id)">
              立即预约
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";

const venues = ref([]);
const venueOccupancy = ref({});
const blockWidth = 80; // 每个时间块的宽度
const businessHours = computed(() => {
  const now = new Date();
  const currentHour = now.getHours();
  // 只返回当前小时之后的时间
  return Array.from({ length: 22 - currentHour }, (_, i) => i + currentHour);
}); // 从当前时间到 22:00

// 刷新页面数据
const refreshPageData = async () => {
  console.log("刷新页面数据");
  await getVenues();
};

// 获取场馆列表
const getVenues = async () => {
  try {
    const { result } = await uniCloud.callFunction({
      name: "venue_list",
    });
    if (result.code === 0) {
      venues.value = result.data;
      // 获取每个场地的占用情况
      getVenuesOccupancy();
    } else {
      uni.showToast({
        title: result.msg || "获取场馆列表失败",
        icon: "none",
      });
    }
  } catch (e) {
    console.error(e);
    uni.showToast({
      title: "获取场馆列表失败",
      icon: "none",
    });
  }
};

// 获取所有场地的占用情况
const getVenuesOccupancy = async () => {
  const today = formatDate(new Date());

  for (const venue of venues.value) {
    try {
      const { result } = await uniCloud.callFunction({
        name: "venue_available_time",
        data: {
          venueId: venue._id,
          date: today,
        },
      });

      if (result.code === 0) {
        // 确保数据格式正确
        const occupiedTimes = result.data.occupiedTimes || [];
        venueOccupancy.value[venue._id] = occupiedTimes;
      }
    } catch (e) {
      console.error("获取场地占用数据失败:", e);
      venueOccupancy.value[venue._id] = [];
    }
  }
};

// 检查时间段是否被占用
const isTimeBlockOccupied = (venue, hour, type, halfCourt) => {
  // 检查是否是过去的时间
  const now = new Date();
  const currentHour = now.getHours();
  if (hour < currentHour) return false;

  if (!venueOccupancy.value[venue._id]) return false;

  const occupiedTimes = venueOccupancy.value[venue._id];
  const currentTime = `${hour.toString().padStart(2, "0")}:00`;

  return occupiedTimes.some((time) => {
    // 将时间转换为分钟数进行比较
    const currentMinutes = timeToMinutes(currentTime);
    const startMinutes = timeToMinutes(time.start);
    const endMinutes = timeToMinutes(time.end);

    // 检查时间是否在占用范围内
    const isInTimeRange =
      currentMinutes >= startMinutes && currentMinutes < endMinutes;

    // 根据预约类型和半场位置进行匹配
    if (type === "full") {
      // 全场预约
      return isInTimeRange && time.type === "full";
    } else if (type === "half") {
      // 半场预约
      // 注意：这里需要处理 half_court 字段的值
      const isHalfCourtMatch =
        time.type === "half" &&
        (time.halfCourt === halfCourt ||
          time.halfCourt === `half_${halfCourt.toLowerCase()}`);
      return isInTimeRange && isHalfCourtMatch;
    }

    return false;
  });
};

// 格式化小时显示
const formatHour = (hour) => {
  return `${hour}:00`;
};

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

// 格式化日期为 YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 今天的日期
const todayDate = computed(() => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}年${month}月${day}日`;
});

// 跳转到场馆详情页
const goToDetail = (venueId) => {
  uni.navigateTo({
    url: `/pages/venues/detail?id=${venueId}`,
  });
};

// 跳转到预约页面
const goToBooking = (venueId) => {
  uni.navigateTo({
    url: `/pages/venues/booking?id=${venueId}`,
  });
};

// 页面显示时刷新数据
onShow(() => {
  console.log("页面显示，触发刷新");
  refreshPageData();
});

onMounted(() => {
  refreshPageData();
});
</script>

<style>
.container {
  padding: 20rpx;
}

.venue-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.venue-card {
  background-color: #ffffff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.venue-swiper {
  width: 100%;
  height: 300rpx;
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
  font-size: 32rpx;
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

/* 占用情况样式 */
.occupancy-section {
  margin: 20rpx 0;
  background-color: #f9f9f9;
  border-radius: 8rpx;
  padding: 16rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.time-bar {
  width: 100%;
  white-space: nowrap;
}

.time-blocks {
  display: inline-flex;
  height: 60rpx;
  border-radius: 6rpx;
  overflow: hidden;
}

.time-block {
  width: 60px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
  border-radius: 4px;
  background-color: #4caf50; /* 默认绿色，表示可预约 */
}

.time-block.occupied-full {
  background-color: #f44336; /* 红色，表示全场已约 */
}

.time-block.occupied-half-a {
  background-color: #ff9800; /* 橙色，表示半场A已约 */
}

.time-block.occupied-half-b {
  background-color: #9c27b0; /* 紫色，表示半场B已约 */
}

.time-text {
  font-size: 20rpx;
  color: #ffffff;
  font-weight: bold;
}

.legend {
  display: flex;
  flex-wrap: nowrap;
  margin-top: 20rpx;
  padding: 10rpx;
  background-color: #f9f9f9;
  border-radius: 8rpx;
  justify-content: space-between;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-right: 10rpx;
}

.legend-item:last-child {
  margin-right: 0;
}

.legend-color {
  width: 24rpx;
  height: 24rpx;
  border-radius: 4rpx;
  margin-right: 6rpx;
}

.legend-color.available {
  background-color: #4caf50;
}

.legend-color.occupied-full {
  background-color: #f44336;
}

.legend-color.occupied-half-a {
  background-color: #ff9800;
}

.legend-color.occupied-half-b {
  background-color: #9c27b0;
}

.legend-item text {
  font-size: 22rpx;
  color: #666;
  white-space: nowrap;
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

/* 操作按钮样式 */
.venue-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20rpx;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.detail-btn {
  background-color: #f5f5f5;
  color: #333;
}

.book-btn {
  background-color: #007aff;
  color: #ffffff;
}
</style>
