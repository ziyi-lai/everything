export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          category: string
          id: string
          period: string | null
          start_date: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          id?: string
          period?: string | null
          start_date: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          id?: string
          period?: string | null
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      capture_attachments: {
        Row: {
          capture_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          user_id: string
        }
        Insert: {
          capture_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          user_id: string
        }
        Update: {
          capture_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capture_attachments_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "captures"
            referencedColumns: ["id"]
          },
        ]
      }
      captures: {
        Row: {
          audio_path: string | null
          converted_to_task_id: string | null
          created_at: string | null
          duration_seconds: number | null
          end_time: string | null
          id: string
          is_timer: boolean | null
          parsed_due: string | null
          parsed_tags: string[] | null
          parsed_title: string | null
          pinned: boolean
          processed: boolean | null
          raw_text: string
          source: Database["public"]["Enums"]["capture_source"] | null
          start_time: string | null
          user_id: string
        }
        Insert: {
          audio_path?: string | null
          converted_to_task_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          is_timer?: boolean | null
          parsed_due?: string | null
          parsed_tags?: string[] | null
          parsed_title?: string | null
          pinned?: boolean
          processed?: boolean | null
          raw_text: string
          source?: Database["public"]["Enums"]["capture_source"] | null
          start_time?: string | null
          user_id: string
        }
        Update: {
          audio_path?: string | null
          converted_to_task_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          is_timer?: boolean | null
          parsed_due?: string | null
          parsed_tags?: string[] | null
          parsed_title?: string | null
          pinned?: boolean
          processed?: boolean | null
          raw_text?: string
          source?: Database["public"]["Enums"]["capture_source"] | null
          start_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "captures_converted_to_task_id_fkey"
            columns: ["converted_to_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_scores: {
        Row: {
          date: string
          id: string
          recovery_score: number | null
          sleep_duration_minutes: number | null
          sleep_quality: number | null
          strain_score: number | null
          user_id: string
        }
        Insert: {
          date: string
          id?: string
          recovery_score?: number | null
          sleep_duration_minutes?: number | null
          sleep_quality?: number | null
          strain_score?: number | null
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          recovery_score?: number | null
          sleep_duration_minutes?: number | null
          sleep_quality?: number | null
          strain_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          created_at: string | null
          id: string
          metric_type: string
          notes: string | null
          recorded_at: string
          source: Database["public"]["Enums"]["metric_source"] | null
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_type: string
          notes?: string | null
          recorded_at: string
          source?: Database["public"]["Enums"]["metric_source"] | null
          unit: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_type?: string
          notes?: string | null
          recorded_at?: string
          source?: Database["public"]["Enums"]["metric_source"] | null
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      highlights: {
        Row: {
          content: string
          created_at: string | null
          id: string
          last_reviewed_at: string | null
          next_review_at: string | null
          note_id: string | null
          note_text: string | null
          position: number | null
          review_count: number | null
          review_priority: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          last_reviewed_at?: string | null
          next_review_at?: string | null
          note_id?: string | null
          note_text?: string | null
          position?: number | null
          review_count?: number | null
          review_priority?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          last_reviewed_at?: string | null
          next_review_at?: string | null
          note_id?: string | null
          note_text?: string | null
          position?: number | null
          review_count?: number | null
          review_priority?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_answers: {
        Row: {
          answer: boolean
          id: string
          question_id: string
          recorded_at: string
          user_id: string
        }
        Insert: {
          answer: boolean
          id?: string
          question_id: string
          recorded_at?: string
          user_id: string
        }
        Update: {
          answer?: boolean
          id?: string
          question_id?: string
          recorded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "journal_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_questions: {
        Row: {
          category: string | null
          id: string
          is_active: boolean | null
          question: string
        }
        Insert: {
          category?: string | null
          id?: string
          is_active?: boolean | null
          question: string
        }
        Update: {
          category?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          description: string | null
          eaten_at: string | null
          estimated_calories: number | null
          id: string
          meal_type: string
          photo_url: string | null
          user_id: string
        }
        Insert: {
          description?: string | null
          eaten_at?: string | null
          estimated_calories?: number | null
          id?: string
          meal_type: string
          photo_url?: string | null
          user_id: string
        }
        Update: {
          description?: string | null
          eaten_at?: string | null
          estimated_calories?: number | null
          id?: string
          meal_type?: string
          photo_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          id: string
          note: string | null
          recorded_at: string
          score: number
          user_id: string
        }
        Insert: {
          id?: string
          note?: string | null
          recorded_at?: string
          score: number
          user_id: string
        }
        Update: {
          id?: string
          note?: string | null
          recorded_at?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      note_links: {
        Row: {
          created_at: string | null
          id: string
          link_type: Database["public"]["Enums"]["link_type"] | null
          source_note_id: string | null
          target_note_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          link_type?: Database["public"]["Enums"]["link_type"] | null
          source_note_id?: string | null
          target_note_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          link_type?: Database["public"]["Enums"]["link_type"] | null
          source_note_id?: string | null
          target_note_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_links_source_note_id_fkey"
            columns: ["source_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_links_target_note_id_fkey"
            columns: ["target_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_clipped: boolean | null
          is_daily_note: boolean | null
          last_reviewed_at: string | null
          next_review_at: string | null
          plain_text: string | null
          review_count: number | null
          review_priority: number | null
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_clipped?: boolean | null
          is_daily_note?: boolean | null
          last_reviewed_at?: string | null
          next_review_at?: string | null
          plain_text?: string | null
          review_count?: number | null
          review_priority?: number | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_clipped?: boolean | null
          is_daily_note?: boolean | null
          last_reviewed_at?: string | null
          next_review_at?: string | null
          plain_text?: string | null
          review_count?: number | null
          review_priority?: number | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          timezone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          timezone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          timezone?: string | null
        }
        Relationships: []
      }
      reading_list: {
        Row: {
          added_at: string | null
          completed_at: string | null
          description: string | null
          id: string
          notes: string | null
          status: string | null
          title: string | null
          url: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          completed_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          title?: string | null
          url: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          completed_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          title?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          domain: Database["public"]["Enums"]["task_domain"] | null
          due_date: string | null
          energy_required: number | null
          estimated_minutes: number | null
          id: string
          parent_id: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          recurrence_rule: string | null
          sort_order: number | null
          status: Database["public"]["Enums"]["task_status"] | null
          tags: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          domain?: Database["public"]["Enums"]["task_domain"] | null
          due_date?: string | null
          energy_required?: number | null
          estimated_minutes?: number | null
          id?: string
          parent_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          recurrence_rule?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          domain?: Database["public"]["Enums"]["task_domain"] | null
          due_date?: string | null
          energy_required?: number | null
          estimated_minutes?: number | null
          id?: string
          parent_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          recurrence_rule?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      capture_source: "text" | "timer" | "voice" | "api"
      link_type: "reference" | "related" | "contradicts" | "extends"
      metric_source: "manual" | "apple_health" | "google_fit" | "api"
      task_domain:
        | "coding"
        | "research"
        | "writing"
        | "life"
        | "health"
        | "finance"
        | "other"
      task_priority: "urgent" | "high" | "medium" | "low"
      task_status: "backlog" | "todo" | "in_progress" | "done" | "cancelled"
      transaction_type: "income" | "expense"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      capture_source: ["text", "timer", "voice", "api"],
      link_type: ["reference", "related", "contradicts", "extends"],
      metric_source: ["manual", "apple_health", "google_fit", "api"],
      task_domain: [
        "coding",
        "research",
        "writing",
        "life",
        "health",
        "finance",
        "other",
      ],
      task_priority: ["urgent", "high", "medium", "low"],
      task_status: ["backlog", "todo", "in_progress", "done", "cancelled"],
      transaction_type: ["income", "expense"],
    },
  },
} as const
