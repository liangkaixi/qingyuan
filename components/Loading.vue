<template>
  <view class="loading-container" v-if="show">
    <view
      class="loading-mask"
      :class="{ 'loading-mask--transparent': transparent }"
    ></view>
    <view class="loading-content">
      <view class="loading-spinner">
        <view class="loading-spinner__item" v-for="i in 12" :key="i"></view>
      </view>
      <text class="loading-text" v-if="text">{{ text }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  text: {
    type: String,
    default: "加载中...",
  },
  transparent: {
    type: Boolean,
    default: false,
  },
});
</script>

<style lang="scss" scoped>
.loading-container {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 9999;

  .loading-mask {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.6);

    &--transparent {
      background-color: transparent;
    }
  }

  .loading-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }

  .loading-spinner {
    position: relative;
    width: 40px;
    height: 40px;
    margin: 0 auto 10px;

    &__item {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 12px;
        margin: 2px;
        border-radius: 2px;
        background-color: #fff;
        transform-origin: center 20px;
      }

      @for $i from 1 through 12 {
        &:nth-child(#{$i}) {
          transform: rotate($i * 30deg);
        }
      }
    }
  }

  .loading-text {
    color: #fff;
    font-size: 14px;
  }
}
</style>
