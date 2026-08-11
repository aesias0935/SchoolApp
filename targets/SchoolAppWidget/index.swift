import WidgetKit
import SwiftUI
import ActivityKit

// MARK: - 1. Live Activity (잠금화면 시간표) Attributes
struct TimetableAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var currentPeriod: String // 예: "3교시"
        var subject: String       // 예: "수학"
        var remainingMinutes: Int // 예: 15
    }
}

// MARK: - 2. Home Widget Data Provider
struct SimpleEntry: TimelineEntry {
    let date: Date
    let progressRate: Int
    let todos: [String]
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), progressRate: 0, todos: [])
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), progressRate: 0, todos: [])
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
        let userDefaults = UserDefaults(suiteName: "group.com.aesias.SchoolApp")
        let progress = userDefaults?.integer(forKey: "progressRate") ?? 0
        let todos = userDefaults?.stringArray(forKey: "todos") ?? []

        let entry = SimpleEntry(date: Date(), progressRate: progress, todos: todos)
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
}

// MARK: - 3. Home Widget View (iOS 17 containerBackground 적용)
struct SchoolAppWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // 상단 달성률 게이지
            HStack {
                Text("오늘 달성률").font(.caption).bold()
                Spacer()
                Text("\(entry.progressRate)%").font(.caption).bold().foregroundColor(.blue)
            }
            ProgressView(value: Double(entry.progressRate), total: 100)
                .tint(.blue)

            Divider().padding(.vertical, 2)

            // 사용자가 추가한 할 일이 없는 경우
            if entry.todos.isEmpty {
                Spacer()
                VStack(alignment: .center) {
                    Text("📝 등록된 할 일이 없습니다")
                        .font(.caption)
                        .foregroundColor(.gray)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
                Spacer()
            } else {
                // 사용자가 추가한 할 일이 있는 경우 (최대 4개 표시)
                ForEach(entry.todos.prefix(4), id: \.self) { todo in
                    HStack {
                        Image(systemName: "circle")
                            .font(.system(size: 10))
                            .foregroundColor(.gray)
                        Text(todo)
                            .font(.caption)
                            .lineLimit(1)
                    }
                }
                Spacer()
            }
        }
        .padding()
        // ⭕ iOS 17 이상 필수 배경 API 처리
        .containerBackground(for: .widget) {
            Color(.systemBackground)
        }
    }
}

@main
struct SchoolAppWidgetBundle: WidgetBundle {
    var body: some Widget {
        HomeWidget()
        TimetableLiveActivity()
    }
}

struct HomeWidget: Widget {
    let kind: String = "SchoolAppWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            SchoolAppWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("학교 생활 위젯")
        .description("오늘의 할 일과 달성률을 확인하세요.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - 4. Live Activity Widget Configuration
struct TimetableLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimetableAttributes.self) { context in
            HStack {
                VStack(alignment: .leading) {
                    Text("🔔 현재 수업").font(.caption).foregroundColor(.gray)
                    Text("\(context.state.currentPeriod) - \(context.state.subject)")
                        .font(.headline).bold()
                }
                Spacer()
                Text("\(context.state.remainingMinutes)분 남음")
                    .font(.title3).bold().foregroundColor(.blue)
            }
            .padding()
            .activityBackgroundTint(Color(.systemBackground))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.state.currentPeriod)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.remainingMinutes)분 남음")
                }
            } compactLeading: {
                Text(context.state.subject)
            } compactTrailing: {
                Text("\(context.state.remainingMinutes)m")
            } minimal: {
                Text("📚")
            }
        }
    }
}