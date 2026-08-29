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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      centers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          status: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          capacity: number
          center_id: string | null
          created_at: string
          formation_id: string | null
          id: string
          name: string
          status: string | null
        }
        Insert: {
          capacity: number
          center_id?: string | null
          created_at?: string
          formation_id?: string | null
          id?: string
          name: string
          status?: string | null
        }
        Update: {
          capacity?: number
          center_id?: string | null
          created_at?: string
          formation_id?: string | null
          id?: string
          name?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          recorded_by: string | null
          title: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          recorded_by?: string | null
          title: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          recorded_by?: string | null
          title?: string
        }
        Relationships: []
      }
      formations: {
        Row: {
          created_at: string
          duration: string
          has_levels: boolean | null
          id: string
          level_count: number | null
          name: string
          total_cost: number
        }
        Insert: {
          created_at?: string
          duration: string
          has_levels?: boolean | null
          id?: string
          level_count?: number | null
          name: string
          total_cost: number
        }
        Update: {
          created_at?: string
          duration?: string
          has_levels?: boolean | null
          id?: string
          level_count?: number | null
          name?: string
          total_cost?: number
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      payment_installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          schedule_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          schedule_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          schedule_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_installments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedules: {
        Row: {
          created_at: string
          id: string
          paid_amount: number | null
          remaining_amount: number
          status: string | null
          student_id: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          paid_amount?: number | null
          remaining_amount: number
          status?: string | null
          student_id?: string | null
          total_amount: number
        }
        Update: {
          created_at?: string
          id?: string
          paid_amount?: number | null
          remaining_amount?: number
          status?: string | null
          student_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          method: string | null
          motif: string | null
          recorded_by: string | null
          student_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          id?: string
          method?: string | null
          motif?: string | null
          recorded_by?: string | null
          student_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          method?: string | null
          motif?: string | null
          recorded_by?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progression_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          level: string | null
          reason: string | null
          recorded_by: string | null
          status: string
          student_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          level?: string | null
          reason?: string | null
          recorded_by?: string | null
          status: string
          student_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          level?: string | null
          reason?: string | null
          recorded_by?: string | null
          status?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_progression_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_id: string | null
          contact: string
          created_at: string
          current_level: string | null
          current_status: string | null
          email: string | null
          enrollment_date: string
          first_name: string
          gender: string | null
          id: string
          last_name: string
          matricule: string
        }
        Insert: {
          class_id?: string | null
          contact: string
          created_at?: string
          current_level?: string | null
          current_status?: string | null
          email?: string | null
          enrollment_date: string
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          matricule: string
        }
        Update: {
          class_id?: string | null
          contact?: string
          created_at?: string
          current_level?: string | null
          current_status?: string | null
          email?: string | null
          enrollment_date?: string
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          matricule?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_centers: {
        Row: {
          center_id: string
          user_id: string
        }
        Insert: {
          center_id: string
          user_id: string
        }
        Update: {
          center_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_centers_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_centers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          role: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id: string
          last_name: string
          role?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          role?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
