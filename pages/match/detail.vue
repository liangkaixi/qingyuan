const { result } = await uniCloud.callFunction({ name: "match_cancel", data: {
matchId: matchId.value, userId: store.userInfo._id, uniIdToken:
uni.getStorageSync('uni_id_token') }, });
