<template>
  <view class="container">
    <view class="venue-list">
      <view
        v-for="venue in venues"
        :key="venue._id"
        class="venue-card"
        @click="goToDetail(venue._id)"
      >
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
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from "vue";

const venues = ref([]);

// 获取场馆列表
const getVenues = async () => {
  try {
    const { result } = await uniCloud.callFunction({
      name: "venue_list",
    });
    if (result.code === 0) {
      venues.value = result.data;
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

// 跳转到场馆详情页
const goToDetail = (venueId) => {
  uni.navigateTo({
    url: `/pages/venues/detail?id=${venueId}`,
  });
};

onMounted(() => {
  getVenues();
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
</style>
