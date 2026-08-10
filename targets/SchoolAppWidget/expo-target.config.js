/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: "widget",
  icon: "https://github.com/expo.png", // 위젯 아이콘 이미지 경로 (또는 필요시 설정)
  entitlements: {
    "com.apple.security.application-groups": ["group.com.aesias.SchoolApp"],
  },
  frameworks: ["ActivityKit", "WidgetKit", "SwiftUI"],
};