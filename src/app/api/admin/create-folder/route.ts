// ============================================================
// API: POST /api/admin/create-folder — Admin creates folder directly
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { createSubjectFolder } from "@/lib/drive";

interface CreateFolderPayload {
  courseCode: string;
  subjectName: string;
  department: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CreateFolderPayload>;
    const courseCode = (body.courseCode ?? "").trim().toUpperCase();
    const subjectName = (body.subjectName ?? "").trim();
    const department = (body.department ?? "").trim();

    if (!courseCode) {
      return NextResponse.json(
        { error: "Course code is required" },
        { status: 400 }
      );
    }

    if (!subjectName) {
      return NextResponse.json(
        { error: "Subject name is required" },
        { status: 400 }
      );
    }

    if (!department) {
      return NextResponse.json(
        { error: "Department is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Check if course already exists
    let existingRequest = null;
    try {
      const { data, error } = await supabase
        .from("subject_requests")
        .select("id")
        .eq("course_code", courseCode)
        .single();

      if (data) {
        existingRequest = data;
      }
    } catch (err) {
      // Course doesn't exist, that's fine
    }

    if (existingRequest) {
      return NextResponse.json(
        { error: `Course code ${courseCode} already exists` },
        { status: 409 }
      );
    }

    // Create Google Drive folder
    let driveFolderId: string;
    try {
      driveFolderId = await createSubjectFolder(courseCode, subjectName);
    } catch (err) {
      console.error("Drive folder creation failed:", err);
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Failed to create Google Drive folder",
        },
        { status: 500 }
      );
    }

    // Create request record with status="approved" and admin as creator
    const { data: newRequest, error: insertError } = await supabase
      .from("subject_requests")
      .insert({
        id: `admin-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        teacher_id: "admin",
        teacher_name: "Admin",
        teacher_email: "admin@coursedrop.local",
        department,
        subject_name: subjectName,
        course_code: courseCode,
        message: "Created directly by admin - no teacher approval needed",
        status: "approved",
        drive_folder_id: driveFolderId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message ?? "Failed to create course record" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        request: newRequest,
        message: `Folder created for ${courseCode}. Now use Sharing to assign teachers.`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "An error occurred" },
      { status: 500 }
    );
  }
}
