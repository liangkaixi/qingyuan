<template>
	<view class="center">
		<uni-sign-in ref="signIn"></uni-sign-in>
		<view class="userInfo" @click.capture="toUserInfo">
      <cloud-image
        width="150rpx"
        height="150rpx"
        v-if="hasLogin && userInfo.avatar_file && userInfo.avatar_file.url"
        :src="userInfo.avatar_file.url"
      ></cloud-image>
			
			<view v-else class="defaultAvatarUrl">
				<uni-icons color="#ffffff" size="50" type="person-filled" />
			</view>
			
			<view class="logo-title">
        <text class="uer-name" v-if="hasLogin">{{
          userInfo.nickname || userInfo.username || userInfo.mobile
        }}</text>
        <text class="uer-name" v-else>{{ $t("mine.notLogged") }}</text>
			</view>
		</view>

    <uni-list class="center-list">
      <uni-list-item
        title="设置"
        link
        to="/pages/ucenter/settings/settings"
        :show-extra-icon="true"
        :extraIcon="{ type: 'gear', color: '#999' }"
      >
			</uni-list-item>
		</uni-list>
	</view>
</template>

<script>
import { store, mutations } from "@/uni_modules/uni-id-pages/common/store.js";
	export default {
		data() {
			return {
      gridList: [],
				ucenterList: [
					[
          {
            title: this.$t("mine.settings"),
            to: "/pages/ucenter/settings/settings",
            icon: "gear",
          },
        ],
				],
				listStyles: {
        height: "150rpx",
        width: "150rpx",
        border: {
          color: "#eee",
          width: "1px",
          style: "solid",
          radius: "100%",
        },
      },
    };
  },
		computed: {
			userInfo() {
      return store.userInfo;
    },
    hasLogin() {
      return store.hasLogin;
    },
		},
		methods: {
			toUserInfo() {
				uni.navigateTo({
        url: "/uni_modules/uni-id-pages/pages/userinfo/userinfo",
				});
			},
  },
};
</script>

<style lang="scss">
.center {
		display: flex;
		flex-direction: column;
  background-color: #f5f5f5;
  min-height: 100vh;
	}

	.userInfo {
  display: flex;
		flex-direction: column;
		align-items: center;
  padding: 50rpx 0;
  background-color: #ffffff;
  margin-bottom: 20rpx;

  .defaultAvatarUrl {
		width: 150rpx;
		height: 150rpx;
    border-radius: 75rpx;
		background-color: #007aff;
    display: flex;
    align-items: center;
		justify-content: center;
	}

	.logo-title {
    margin-top: 20rpx;

	.uer-name {
      font-size: 32rpx;
      color: #333;
    }
  }
	}

	.center-list {
  margin-top: 20rpx;
  background-color: #ffffff;
	}
</style>
