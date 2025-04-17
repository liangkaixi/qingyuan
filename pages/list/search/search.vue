<template>
  <view class="container">
    <view class="search-header">
      <view class="search-box">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索比赛"
          @confirm="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">搜索</button>
      </view>
    </view>

    <view v-if="searchResults.length > 0" class="search-results">
      <view
        v-for="match in searchResults"
        :key="match._id"
        class="match-item"
        @click="viewMatchDetail(match._id)"
      >
        <view class="match-header">
          <text class="match-type">{{
            getMatchTypeText(match.matchType)
          }}</text>
          <text :class="['match-status', getStatusClass(match.status)]">{{
            getStatusText(match.status)
          }}</text>
        </view>

        <view class="match-info">
          <view class="info-row">
            <text class="label">发起球队：</text>
            <text class="value">{{ match.teamName }}</text>
          </view>
          <view class="info-row">
            <text class="label">时间：</text>
            <text class="value"
              >{{ match.date }} {{ match.startTime }}-{{ match.endTime }}</text
            >
          </view>
          <view class="info-row">
            <text class="label">地点：</text>
            <text class="value">{{ match.venueName }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else-if="hasSearched" class="empty-state">
      <image
        src="/static/empty.png"
        mode="aspectFit"
        class="empty-image"
      ></image>
      <text class="empty-text">未找到相关比赛</text>
    </view>

    <uni-load-more :status="loadMoreStatus"></uni-load-more>
  </view>
</template>

<script>
import { ref } from "vue";

export default {
  setup() {
    const searchKeyword = ref("");
    const searchResults = ref([]);
    const hasSearched = ref(false);
    const loadMoreStatus = ref("more");
    const page = ref(1);
    const pageSize = ref(10);

    const getMatchTypeText = (type) => {
      const types = {
        basketball: "篮球",
        volleyball: "气排球",
      };
      return types[type] || type;
    };

    const getStatusText = (status) => {
      const statusMap = {
        pending: "待接受",
        accepted: "已接受",
        rejected: "已拒绝",
        cancelled: "已取消",
      };
      return statusMap[status] || status;
    };

    const getStatusClass = (status) => {
      const classMap = {
        pending: "status-pending",
        accepted: "status-accepted",
        rejected: "status-rejected",
        cancelled: "status-cancelled",
      };
      return classMap[status] || "";
    };

    const handleSearch = async () => {
      if (!searchKeyword.value.trim()) {
        uni.showToast({
          title: "请输入搜索关键词",
          icon: "none",
        });
        return;
      }

      try {
        loadMoreStatus.value = "loading";
        const { result } = await uniCloud.callFunction({
          name: "match_search",
          data: {
            keyword: searchKeyword.value,
            page: page.value,
            pageSize: pageSize.value,
          },
        });

        if (result.code === 0) {
          searchResults.value = result.data.list;
          hasSearched.value = true;
          loadMoreStatus.value =
            result.data.list.length < pageSize.value ? "noMore" : "more";
        } else {
          loadMoreStatus.value = "more";
          uni.showToast({
            title: result.msg || "搜索失败",
            icon: "none",
          });
        }
      } catch (e) {
        console.error("搜索失败：", e);
        loadMoreStatus.value = "more";
        uni.showToast({
          title: "搜索失败",
          icon: "none",
        });
      }
    };

    const viewMatchDetail = (matchId) => {
      uni.navigateTo({
        url: `/pages/match/detail?id=${matchId}`,
      });
    };

    return {
      searchKeyword,
      searchResults,
      hasSearched,
      loadMoreStatus,
      getMatchTypeText,
      getStatusText,
      getStatusClass,
      handleSearch,
      viewMatchDetail,
    };
  },
};
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.search-header {
  margin-bottom: 20rpx;

  .search-box {
    display: flex;
    align-items: center;
    background-color: #fff;
    border-radius: 8rpx;
    padding: 10rpx;

    input {
      flex: 1;
      height: 60rpx;
      padding: 0 20rpx;
      font-size: 28rpx;
    }

    .search-btn {
      width: 120rpx;
      height: 60rpx;
      line-height: 60rpx;
      text-align: center;
      background-color: #1890ff;
      color: #fff;
      border-radius: 8rpx;
      font-size: 28rpx;
      margin-left: 20rpx;
    }
  }
}

.search-results {
  .match-item {
    background-color: #fff;
    border-radius: 12rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;

      .match-type {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }

      .match-status {
        font-size: 24rpx;
        padding: 4rpx 16rpx;
        border-radius: 20rpx;

        &.status-pending {
          background-color: #ffd591;
          color: #d46b08;
        }

        &.status-accepted {
          background-color: #b7eb8f;
          color: #389e0d;
        }

        &.status-rejected {
          background-color: #ffa39e;
          color: #cf1322;
        }

        &.status-cancelled {
          background-color: #d9d9d9;
          color: #666;
        }
      }
    }

    .match-info {
      .info-row {
        display: flex;
        margin-bottom: 10rpx;

        .label {
          color: #666;
          width: 120rpx;
        }

        .value {
          color: #333;
          flex: 1;
        }
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

  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style>
