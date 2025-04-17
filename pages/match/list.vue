<template>
  <view class="container">
    <view class="header">
      <text class="title">比赛列表</text>
    </view>

    <view v-if="matches.length > 0" class="match-list">
      <view
        v-for="match in matches"
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
          <view class="info-row">
            <text class="label">邀请：</text>
            <text class="value">{{ match.invitation }}</text>
          </view>
        </view>

        <view
          v-if="match.teams && match.teams.length > 0"
          class="teams-section"
        >
          <text class="teams-title">应邀球队：</text>
          <view
            v-for="team in match.teams"
            :key="team.userId"
            class="team-item"
          >
            <text class="team-name">{{ team.name }}</text>
            <text
              :class="[
                'team-status',
                team.status === 'accepted' ? 'accepted' : 'pending',
              ]"
            >
              {{ team.status === "accepted" ? "已接受" : "待确认" }}
            </text>
          </view>
        </view>

        <view class="match-actions">
          <button
            v-if="match.status === 'pending' && hasLogin && !isMyMatch(match)"
            class="action-btn accept"
            @click.stop="acceptMatch(match)"
          >
            接受比赛
          </button>
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <image
        src="/static/empty.png"
        mode="aspectFit"
        class="empty-image"
      ></image>
      <text class="empty-text">暂无比赛记录</text>
    </view>

    <uni-load-more :status="loadMoreStatus"></uni-load-more>
  </view>
</template>

<script>
import { store } from "@/uni_modules/uni-id-pages/common/store.js";

export default {
  data() {
    return {
      matches: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: "more",
      showAcceptForm: false,
      currentMatch: null,
      teamName: "",
      contactPhone: "",
    };
  },
  computed: {
    hasLogin() {
      return store.hasLogin;
    },
  },
  onLoad() {
    this.fetchMatches();
  },
  onPullDownRefresh() {
    this.page = 1;
    this.fetchMatches().then(() => {
      uni.stopPullDownRefresh();
    });
  },
  onReachBottom() {
    if (this.loadMoreStatus === "more") {
      this.page++;
      this.fetchMatches();
    }
  },
  methods: {
    async fetchMatches() {
      try {
        this.loadMoreStatus = "loading";
        const { result } = await uniCloud.callFunction({
          name: "match_list",
          data: {
            page: this.page,
            pageSize: this.pageSize,
            status: "pending", // 只获取待接受的比赛
          },
        });

        if (result.code === 0) {
          if (this.page === 1) {
            this.matches = result.data.list;
          } else {
            this.matches = [...this.matches, ...result.data.list];
          }

          this.loadMoreStatus =
            result.data.list.length < this.pageSize ? "noMore" : "more";
        } else {
          this.loadMoreStatus = "more";
          uni.showToast({
            title: result.msg,
            icon: "none",
          });
        }
      } catch (e) {
        console.error("获取比赛列表失败：", e);
        this.loadMoreStatus = "more";
        uni.showToast({
          title: "获取比赛列表失败",
          icon: "none",
        });
      }
    },
    getMatchTypeText(type) {
      const types = {
        basketball: "篮球",
        volleyball: "气排球",
      };
      return types[type] || type;
    },
    getStatusText(status) {
      const statusMap = {
        pending: "待接受",
        accepted: "已接受",
        rejected: "已拒绝",
        cancelled: "已取消",
      };
      return statusMap[status] || status;
    },
    getStatusClass(status) {
      const classMap = {
        pending: "status-pending",
        accepted: "status-accepted",
        rejected: "status-rejected",
        cancelled: "status-cancelled",
      };
      return classMap[status] || "";
    },
    viewMatchDetail(matchId) {
      uni.navigateTo({
        url: `/pages/match/detail?id=${matchId}`,
      });
    },
    isMyMatch(match) {
      if (!this.hasLogin) return false;
      return match.userId === store.userInfo._id;
    },
    acceptMatch(match) {
      if (!this.hasLogin) {
        uni.showModal({
          title: "提示",
          content: "请先登录后再接受比赛",
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

      this.currentMatch = match;
      this.showAcceptForm = true;

      // 显示接受比赛的表单
      uni.showModal({
        title: "接受比赛",
        content: "请输入您的球队名称和联系方式",
        editable: true,
        placeholderText: "球队名称",
        success: (res) => {
          if (res.confirm) {
            if (!res.content.trim()) {
              uni.showToast({
                title: "请输入球队名称",
                icon: "none",
              });
              return;
            }

            this.teamName = res.content;

            // 再次弹窗获取联系方式
            uni.showModal({
              title: "联系方式",
              content: "请输入您的联系方式",
              editable: true,
              placeholderText: "手机号码",
              success: (phoneRes) => {
                if (phoneRes.confirm) {
                  if (!phoneRes.content.trim()) {
                    uni.showToast({
                      title: "请输入联系方式",
                      icon: "none",
                    });
                    return;
                  }

                  this.contactPhone = phoneRes.content;

                  // 确认接受比赛
                  uni.showModal({
                    title: "确认",
                    content: `确定要接受这场比赛吗？\n球队：${this.teamName}\n联系方式：${this.contactPhone}`,
                    success: (confirmRes) => {
                      if (confirmRes.confirm) {
                        this.submitAcceptMatch();
                      }
                    },
                  });
                }
              },
            });
          }
        },
      });
    },
    async submitAcceptMatch() {
      try {
        uni.showLoading({
          title: "提交中...",
        });

        const { result } = await uniCloud.callFunction({
          name: "match_accept",
          data: {
            matchId: this.currentMatch._id,
            teamName: this.teamName,
            contactPhone: this.contactPhone,
            userId: store.userInfo._id,
          },
        });

        uni.hideLoading();

        if (result.code === 0) {
          uni.showToast({
            title: "接受成功",
            icon: "success",
          });
          this.fetchMatches();
        } else {
          uni.showToast({
            title: result.msg || "接受失败",
            icon: "none",
          });
        }
      } catch (e) {
        uni.hideLoading();
        console.error("接受比赛失败：", e);
        uni.showToast({
          title: "接受失败",
          icon: "none",
        });
      }
    },
  },
};
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;

  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.match-list {
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

    .teams-section {
      margin-top: 20rpx;
      padding-top: 20rpx;
      border-top: 1rpx solid #eee;

      .teams-title {
        font-size: 28rpx;
        color: #666;
        margin-bottom: 10rpx;
      }

      .team-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10rpx 0;

        .team-name {
          font-size: 28rpx;
          color: #333;
        }

        .team-status {
          font-size: 24rpx;
          padding: 4rpx 16rpx;
          border-radius: 20rpx;

          &.accepted {
            background-color: #b7eb8f;
            color: #389e0d;
          }

          &.pending {
            background-color: #ffd591;
            color: #d46b08;
          }
        }
      }
    }

    .match-actions {
      margin-top: 20rpx;
      display: flex;
      justify-content: flex-end;

      .action-btn {
        font-size: 24rpx;
        padding: 6rpx 20rpx;
        border-radius: 20rpx;
        margin-left: 20rpx;

        &.accept {
          background-color: #52c41a;
          color: #fff;
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
