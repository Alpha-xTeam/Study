"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";

interface Class {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  join_code: string;
}

interface Post {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  author_name: string;
  author_avatar?: string;
  file_url?: string;
  file_name?: string;
  file_urls?: string[];
  file_names?: string[];
  files?: PostFile[];
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_at: string;
  max_points: number;
  created_at: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  created_by?: string;
  submissions?: Submission[];
  files?: AssignmentFile[];
}

interface AssignmentFile {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content?: string;
  grade?: number;
  submitted_at: string;
  graded_at?: string;
  feedback?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  graded_by?: string;
  student_name?: string;
  student_email?: string;
  student_avatar?: string;
  files?: SubmissionFile[];
  profiles?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

interface SubmissionFile {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
}

interface ClassMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    full_name: string;
    email: string;
    avatar_url?: string;
    role?: string; // إضافة role للتوافق مع الكود الحالي
  };
}

interface Question {
  id: string;
  content: string;
  author_id: string;
  class_id: string;
  created_at: string;
  author_name: string;
  author_avatar?: string;
  answer?: Answer;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
  answers?: Answer[];
}

interface Answer {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  author_name: string;
  author_avatar?: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface Playlist {
  id: string;
  class_id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  files?: PlaylistFile[];
  playlist_files?: PlaylistFile[];
}

interface PlaylistFile {
  id: string;
  playlist_id: string;
  file_id: string;
  position: number;
  created_at: string;
  files?: {
    id: string;
    name: string;
    url: string;
    uploaded_by: string;
    class_id: string;
    assignment_id?: string;
    created_at: string;
  };
}

interface ProfessorProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface AvailableFile {
  id: string;
  name: string;
  url: string;
  created_at: string;
  source: string;
  author_name?: string;
}

interface SearchedProfessor {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface PostFile {
  id: string;
  file_url?: string;
  file_name?: string;
  file_urls?: string[];
  file_names?: string[];
  created_at: string;
  author_id: string;
  profiles?: {
    full_name?: string;
  };
}

interface FileRecord {
  id: string;
  name: string;
  url: string;
  uploaded_by: string;
  class_id: string;
  assignment_id?: string;
  created_at: string;
}

export default function ClassPage() {
  const params = useParams();
  const classId = params.id as string;
  const [classData, setClassData] = useState<Class | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [professorProfile, setProfessorProfile] = useState<ProfessorProfile | null>(null);
  const [activeTab, setActiveTab] = useState<
    "posts" | "assignments" | "playlists" | "members" | "questions"
  >("posts");
  const [newPost, setNewPost] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  // Questions related states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [answeringQuestion, setAnsweringQuestion] = useState<string | null>(null);
  const [answerContent, setAnswerContent] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<string | null>(null);

  // Playlist related states
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    title: "",
    description: "",
    isPublic: false,
  });
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showAddFilesToPlaylist, setShowAddFilesToPlaylist] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<AvailableFile[]>([]);
  const [selectedFilesForPlaylist, setSelectedFilesForPlaylist] = useState<string[]>([]);
  const [uploadingPlaylistFiles, setUploadingPlaylistFiles] = useState(false);
  const [playlistFilesToUpload, setPlaylistFilesToUpload] = useState<File[]>([]);
  const [addingFilesToPlaylist, setAddingFilesToPlaylist] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    maxPoints: 100,
  });
  const [assignmentFiles, setAssignmentFiles] = useState<File[]>([]);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(
    null
  );
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );
  const [editingPostContent, setEditingPostContent] = useState("");
  const [editingAssignmentData, setEditingAssignmentData] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    maxPoints: 100,
  });
  const [editingPostFile, setEditingPostFile] = useState<File | null>(null);
  const [editingPostFiles, setEditingPostFiles] = useState<File[]>([]);
  const [editingAssignmentFile, setEditingAssignmentFile] =
    useState<File | null>(null);
  const [editingAssignmentFiles, setEditingAssignmentFiles] = useState<File[]>(
    []
  );
  const [editingPostLoading, setEditingPostLoading] = useState(false);
  const [editingAssignmentLoading, setEditingAssignmentLoading] =
    useState(false);
  const [showAddProfessorForm, setShowAddProfessorForm] = useState(false);
  const [professorEmail, setProfessorEmail] = useState("");
  const [addingProfessor, setAddingProfessor] = useState(false);
  const [refreshingData, setRefreshingData] = useState(false);
  const { supabase, user, profile } = useSupabase();
  const router = useRouter();

  // Settings related states
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [searchProfessorEmail, setSearchProfessorEmail] = useState("");
  const [searchedProfessors, setSearchedProfessors] = useState<SearchedProfessor[]>([]);
  const [searchingProfessors, setSearchingProfessors] = useState(false);
  const [assigningProfessor, setAssigningProfessor] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
  // لا تقم بأي إعادة توجيه بناءً على معرف المستخدم، فقط تحقق من وجود المستخدم
    fetchClassData();
  }, [user, classId, router]);

  // Refresh data when switching to members tab
  useEffect(() => {
    if (activeTab === "members") {
      fetchClassData();
    }
  }, [activeTab]);

  const fetchClassData = async () => {
    try {
      setRefreshingData(true);
      // Fetch class info
      const { data: classInfo, error: classError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .single();

      if (classError) throw classError;
      setClassData(classInfo);

      // Fetch posts with author names and avatars
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(
          `
          id,
          class_id,
          author_id,
          content,
          file_url,
          file_name,
          file_urls,
          file_names,
          created_at,
          updated_at,
          profiles!posts_author_id_fkey(full_name, avatar_url)
        `
        )
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("❌ Posts fetch error:", postsError);
        throw postsError;
      }

      const formattedPosts = postsData.map((post: Post) => ({
        ...post,
        author_name:
          post.profiles?.full_name && post.profiles.full_name.trim() !== ""
            ? post.profiles.full_name
            : (post.author_id === "00000000-0000-0000-0000-000000000000" ? "ضيف" : "مستخدم مجهول"),
        author_avatar: post.profiles?.avatar_url || null,
        // Handle both old single file format and new multiple files format
        file_urls: Array.isArray(post.file_urls) && post.file_urls.length > 0 
          ? post.file_urls 
          : (post.file_url ? [post.file_url] : []),
        file_names: Array.isArray(post.file_names) && post.file_names.length > 0 
          ? post.file_names 
          : (post.file_name ? [post.file_name] : []),
      }));

      console.log("� Formatted posts:", formattedPosts.length, "posts");
      console.log("📎 First post file_urls:", formattedPosts[0]?.file_urls);
      console.log("📄 First post file_names:", formattedPosts[0]?.file_names);
      setPosts(formattedPosts);

      // Fetch assignments with submissions for current user
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select(
          `
          *,
          submissions!inner(
            id,
            student_id,
            content,
            grade,
            submitted_at,
            graded_at,
            feedback,
            file_url,
            file_name,
            file_size,
            file_type,
            graded_by,
            profiles!submissions_student_id_fkey(
              full_name,
              email,
              avatar_url
            )
          )
        `
        )
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
        // Try without submissions if there's an error
        const { data: assignmentsFallback, error: assignmentsFallbackError } =
          await supabase
            .from("assignments")
            .select("*")
            .eq("class_id", classId)
            .order("created_at", { ascending: false });

        if (assignmentsFallbackError) throw assignmentsFallbackError;
        setAssignments(assignmentsFallback || []);
      } else {
        // Process assignments with submissions
        const processedAssignments =
          assignmentsData?.map((assignment: Assignment) => ({
            ...assignment,
            submissions:
              assignment.submissions?.map((sub: Submission) => ({
                ...sub,
                student_name:
                  sub.profiles?.full_name &&
                  sub.profiles.full_name.trim() !== ""
                    ? sub.profiles.full_name
                    : (sub.student_id === "00000000-0000-0000-0000-000000000000" ? "ضيف" : "مستخدم مجهول"),
                student_email: sub.profiles?.email || "",
                student_avatar: sub.profiles?.avatar_url || null,
              })) || [],
          })) || [];
        setAssignments(processedAssignments);
      }

      // Fetch class members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from("class_members")
        .select(
          `
          id,
          user_id,
          role,
          joined_at,
          profiles (
            full_name,
            email,
            avatar_url
          )
        `
        )
        .eq("class_id", classId)
        .order("joined_at", { ascending: false });

      if (membersError) {
        console.error("❌ Members fetch error:", membersError);
        throw membersError;
      }

      // Debug logs for troubleshooting (remove after fixing)
      if (process.env.NODE_ENV === "development") {
        console.log("📋 Members data:", membersData);
        console.log("📋 First member:", membersData?.[0]);
        console.log("📋 First member profile:", membersData?.[0]?.profiles);
        console.log(
          "📋 First member full_name:",
          membersData?.[0]?.profiles?.full_name
        );
      }

      // If no members found, try to fetch without profiles first
      if (!membersData || membersData.length === 0) {
        console.log("⚠️ No members found, checking class_members table...");
        const { data: rawMembers, error: rawError } = await supabase
          .from("class_members")
          .select("*")
          .eq("class_id", classId);

        console.log("📋 Raw members data:", rawMembers);
        console.log("📋 Raw error:", rawError);
      }

      // Validate member data and add class owner if not already a member
      const validatedMembers = (membersData || []).map((member: ClassMember) => ({
        ...member,
        profiles: member.profiles || { full_name: "Anonymous User", email: "" },
      }));

      // Check if class owner is in the members list
      const ownerInMembers = validatedMembers.some((member: ClassMember) => member.user_id === classInfo.owner_id);
      
      if (!ownerInMembers && classInfo.owner_id) {
        // First, try to insert the owner into class_members if not already there
        const { error: insertError } = await supabase
          .from("class_members")
          .insert({
            class_id: classId,
            user_id: classInfo.owner_id,
            role: "Professor", // Default role for class owner
          })
          .select()
          .single();

        // If insertion fails (likely because owner is already a member), that's fine
        if (insertError && insertError.code !== '23505') { // 23505 is unique constraint violation
          console.error("Error inserting owner as member:", insertError);
        }

        // Fetch owner profile
        const { data: ownerProfile, error: ownerError } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url, role")
          .eq("id", classInfo.owner_id)
          .single();

        if (!ownerError && ownerProfile) {
          // Add owner as a member with appropriate role
          const ownerAsMember = {
            id: `owner-${classInfo.owner_id}`, // Temporary ID for display
            user_id: classInfo.owner_id,
            role: ownerProfile.role === "admin" ? "admin" : "professor", // Use profile role
            joined_at: classInfo.created_at, // Use class creation date as join date
            profiles: {
              full_name: ownerProfile.full_name || "Class Owner",
              email: ownerProfile.email || "",
              avatar_url: ownerProfile.avatar_url || null,
            },
          };
          validatedMembers.unshift(ownerAsMember); // Add owner at the top
        }
      }

      // Also ensure current user (if admin/professor) is in the members list
      const currentUserInMembers = validatedMembers.some((member: ClassMember) => member.user_id === user?.id);
      
      if (!currentUserInMembers && user?.id && (profile?.role === "admin" || profile?.role === "Professor")) {
        // Try to insert current user into class_members if they're admin/professor
        const { error: insertCurrentUserError } = await supabase
          .from("class_members")
          .insert({
            class_id: classId,
            user_id: user.id,
            role: profile.role === "admin" ? "admin" : "Professor",
          })
          .select()
          .single();

        // If insertion fails (likely because user is already a member), that's fine
        if (insertCurrentUserError && insertCurrentUserError.code !== '23505') {
          console.error("Error inserting current user as member:", insertCurrentUserError);
        } else if (!insertCurrentUserError) {
          // Successfully inserted, add to display list
          const currentUserAsMember = {
            id: `user-${user.id}`,
            user_id: user.id,
            role: profile.role === "admin" ? "admin" : "Professor",
            joined_at: new Date().toISOString(),
            profiles: {
              full_name: profile.full_name || "Current User",
              email: profile.email || "",
              avatar_url: profile.avatar_url || null,
            },
          };
          validatedMembers.push(currentUserAsMember);
        }
      }

      setMembers(validatedMembers);

      // Fetch professor profile (class owner)
      const { data: professorData, error: professorError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .eq("id", classInfo.owner_id)
        .single();

      if (professorError) {
        console.error("❌ Professor profile fetch error:", professorError);
      } else {
        setProfessorProfile(professorData);
      }

      // Fetch playlists with files
      const { data: playlistsData, error: playlistsError } = await supabase
        .from("playlists")
        .select(`
          *,
          playlist_files (
            id,
            file_id,
            position,
            created_at,
            files (
              id,
              name,
              url,
              uploaded_by,
              class_id,
              assignment_id,
              created_at
            )
          )
        `)
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

      if (playlistsError) {
        console.error("❌ Playlists fetch error:", playlistsError);
      } else {
        const formattedPlaylists = playlistsData?.map((playlist: Playlist) => ({
          ...playlist,
          files: playlist.playlist_files?.map((pf: PlaylistFile) => ({
            ...pf,
            files: pf.files,
          })) || [],
        })) || [];
        setPlaylists(formattedPlaylists);
      }
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select(`
          *,
          profiles!questions_author_id_fkey(full_name, avatar_url),
          answers (
            id,
            content,
            author_id,
            created_at,
            profiles!answers_author_id_fkey(full_name, avatar_url)
          )
        `)
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

      if (questionsError) {
        console.error("❌ Questions fetch error:", questionsError);
      } else {
        const formattedQuestions = questionsData?.map((question: Question) => ({
          ...question,
          author_name:
            question.profiles?.full_name && question.profiles.full_name.trim() !== ""
              ? question.profiles.full_name
              : (question.author_id === "00000000-0000-0000-0000-000000000000" ? "ضيف" : "مستخدم مجهول"),
          author_avatar: question.profiles?.avatar_url || null,
          answer: question.answers?.[0] ? {
            ...question.answers[0],
            author_name:
              question.answers[0].profiles?.full_name &&
              question.answers[0].profiles.full_name.trim() !== ""
                ? question.answers[0].profiles.full_name
                : "Anonymous User",
            author_avatar: question.answers[0].profiles?.avatar_url || null,
          } : undefined,
        })) || [];
        setQuestions(formattedQuestions);
      }
    } catch (error) {
      console.error("Error fetching class data:", error);
    } finally {
      setRefreshingData(false);
    }
  };

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setSubmittingQuestion(true);

    try {
      const { data, error } = await supabase
        .from("questions")
        .insert({
          class_id: classId,
          author_id: user?.id,
          content: newQuestion,
        })
        .select(`
          *,
          profiles!questions_author_id_fkey(full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      const newQuestionWithAuthor = {
        ...data,
        author_name:
          data.profiles?.full_name && data.profiles.full_name.trim() !== ""
            ? data.profiles.full_name
            : "Anonymous User",
        author_avatar: data.profiles?.avatar_url || null,
      };

      setQuestions([newQuestionWithAuthor, ...questions]);
      setNewQuestion("");
      setShowQuestionForm(false);
    } catch (error) {
      console.error("Error submitting question:", error);
      alert("Error submitting question");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answeringQuestion || !answerContent.trim()) return;

    // Check if user is the class owner or professor
    if (classData?.owner_id !== user?.id && profile?.role !== "Professor") {
      alert("Sorry, only professors can answer questions");
      return;
    }

    setSubmittingAnswer(true);

    try {
      const { data, error } = await supabase
        .from("answers")
        .insert({
          question_id: answeringQuestion,
          author_id: user?.id,
          content: answerContent,
        })
        .select(`
          *,
          profiles!answers_author_id_fkey(full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Update the question with the answer
      const updatedQuestions = questions.map((question) => {
        if (question.id === answeringQuestion) {
          return {
            ...question,
            answer: {
              ...data,
              author_name:
                data.profiles?.full_name && data.profiles.full_name.trim() !== ""
                  ? data.profiles.full_name
                  : "Anonymous User",
              author_avatar: data.profiles?.avatar_url || null,
            },
          };
        }
        return question;
      });

      setQuestions(updatedQuestions);
      setAnsweringQuestion(null);
      setAnswerContent("");
    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("Error submitting answer");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    // Check if user is the class owner, professor, or admin
    if (classData?.owner_id !== user?.id && profile?.role !== "Professor" && profile?.role !== "admin") {
      alert("Sorry, only professors and admins can post");
      return;
    }

    setUploadingFile(true);

    try {
      const fileUrls = [];
      const fileNames = [];

      // Upload all selected files
      if (selectedFiles && selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split(".").pop();
          const fileNameUpload = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${fileExt}`;
          const filePath = `posts/${classId}/${fileNameUpload}`;

          const { error: uploadError } = await supabase.storage
            .from("class-files")
            .upload(filePath, file);

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            alert(`Error uploading file ${file.name}`);
            return;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("class-files").getPublicUrl(filePath);

          fileUrls.push(publicUrl);
          fileNames.push(file.name);

          // Insert file into files table
          const { error: fileInsertError } = await supabase
            .from("files")
            .insert({
              name: file.name,
              url: publicUrl,
              uploaded_by: user?.id,
              class_id: classId,
              assignment_id: null, // Not associated with an assignment
            });

          if (fileInsertError) {
            console.error("Error inserting file into files table:", fileInsertError);
            // Continue with other files even if one fails
          }
        }
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({
          class_id: classId,
          author_id: user?.id,
          content: newPost,
          file_urls: fileUrls.length > 0 ? fileUrls : null,
          file_names: fileNames.length > 0 ? fileNames : null,
        })
        .select(`
          id,
          class_id,
          author_id,
          content,
          file_url,
          file_name,
          file_urls,
          file_names,
          created_at,
          updated_at,
          profiles!posts_author_id_fkey(full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      const newPostWithAuthor = {
        ...data,
        author_name:
          data.profiles?.full_name && data.profiles.full_name.trim() !== ""
            ? data.profiles.full_name
            : "Anonymous User",
        author_avatar: data.profiles?.avatar_url || null,
        // Handle both old single file format and new multiple files format
        file_urls: Array.isArray(data.file_urls) && data.file_urls.length > 0 
          ? data.file_urls 
          : (data.file_url ? [data.file_url] : []),
        file_names: Array.isArray(data.file_names) && data.file_names.length > 0 
          ? data.file_names 
          : (data.file_name ? [data.file_name] : []),
      };

      console.log("🆕 New post created:", newPostWithAuthor);
      console.log("📎 File URLs:", newPostWithAuthor.file_urls);
      console.log("📄 File Names:", newPostWithAuthor.file_names);

      setPosts([newPostWithAuthor, ...posts]);
      setNewPost("");
      setSelectedFiles([]);
      setShowPostForm(false);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Error creating post");
    } finally {
      setUploadingFile(false);
    }
  };

  const addProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professorEmail.trim()) return;

    // Check if user is the class owner or admin
    if (classData?.owner_id !== user?.id && profile?.role !== "admin") {
      alert("Sorry, only the class owner or admin can add professors");
      return;
    }

    setAddingProfessor(true);

    try {
      // Find user by email
      const { data: professorProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("email", professorEmail.trim())
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") {
          // This is expected when email doesn't exist - don't log as error
          alert("No user found with this email address");
        } else {
          console.error("Error finding professor:", profileError);
          alert("Error finding professor");
        }
        return;
      }

      // Check if already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from("class_members")
        .select("id")
        .eq("class_id", classId)
        .eq("user_id", professorProfile.id)
        .single();

      if (memberCheckError && memberCheckError.code !== "PGRST116") {
        console.error("Error checking membership:", memberCheckError);
        alert("Error checking membership");
        return;
      }

      if (existingMember) {
        alert("This user is already a member of the class");
        return;
      }

      // Add as professor
      const { error: memberError } = await supabase
        .from("class_members")
        .insert({
          class_id: classId,
          user_id: professorProfile.id,
          role: "Professor",
        });

      if (memberError) {
        console.error("Error adding professor:", memberError);
        alert("Error adding professor: " + memberError.message);
        return;
      }

      // Update local state
      const newMember = {
        id: Date.now().toString(), // Temporary ID
        user_id: professorProfile.id,
        role: "Professor",
        joined_at: new Date().toISOString(),
        profiles: {
          full_name: professorProfile.full_name,
          email: professorProfile.email,
        },
      };

      setMembers((prevMembers) => [newMember, ...prevMembers]);
      setProfessorEmail("");
      setShowAddProfessorForm(false);

      alert(`Professor ${professorProfile.full_name} added successfully`);
    } catch (error) {
      console.error("Error adding professor:", error);
      alert("Error adding professor");
    } finally {
      setAddingProfessor(false);
    }
  };

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title.trim()) return;

    // Check if user is the class owner or professor
    if (classData?.owner_id !== user?.id && profile?.role !== "Professor") {
      alert("Sorry, only professors can create assignments");
      return;
    }

    setCreatingAssignment(true);

    try {
      let fileUrl = null;
      let fileName = null;
      let fileSize = null;
      let fileType = null;

      // Upload file if selected
      if (assignmentFile) {
        const fileExt = assignmentFile.name.split(".").pop();
        const fileNameUpload = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `assignments/${classId}/${fileNameUpload}`;

        const { error: uploadError } = await supabase.storage
          .from("assignment-files")
          .upload(filePath, assignmentFile);

        if (uploadError) {
          console.error("Error uploading assignment file:", uploadError);
          alert("Error uploading file");
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("assignment-files").getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = assignmentFile.name;
        fileSize = assignmentFile.size;
        fileType = assignmentFile.type;

        // Insert file into files table
        const { error: fileInsertError } = await supabase
          .from("files")
          .insert({
            name: assignmentFile.name,
            url: publicUrl,
            uploaded_by: user?.id,
            class_id: classId,
            assignment_id: null, // Will be updated after assignment is created
          });

        if (fileInsertError) {
          console.error("Error inserting file into files table:", fileInsertError);
          // Continue with assignment creation even if file insertion fails
        }
      }

      // Combine date and time
      const dueDateTime = new Date(
        `${newAssignment.dueDate}T${newAssignment.dueTime}`
      );

      const { data, error } = await supabase
        .from("assignments")
        .insert({
          class_id: classId,
          title: newAssignment.title,
          description: newAssignment.description,
          due_at: dueDateTime.toISOString(),
          max_points: newAssignment.maxPoints,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          file_type: fileType,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update the file entry with the assignment ID if a file was uploaded
      if (assignmentFile && data.id) {
        const { error: updateFileError } = await supabase
          .from("files")
          .update({ assignment_id: data.id })
          .eq("url", fileUrl)
          .eq("class_id", classId);

        if (updateFileError) {
          console.error("Error updating file with assignment ID:", updateFileError);
          // Continue even if update fails
        }
      }

      // Update local state
      setAssignments([data, ...assignments]);
      setNewAssignment({
        title: "",
        description: "",
        dueDate: "",
        dueTime: "",
        maxPoints: 100,
      });
      setAssignmentFile(null);
      setShowAssignmentForm(false);

      alert("Assignment created successfully");
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("Error creating assignment");
    } finally {
      setCreatingAssignment(false);
    }
  };

  const submitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setSubmittingAssignment(true);

    try {
      let fileUrl = null;
      let fileName = null;
      let fileSize = null;
      let fileType = null;

      // Upload file if selected
      if (submissionFile) {
        const fileExt = submissionFile.name.split(".").pop();
        const fileNameUpload = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `submissions/${selectedAssignment.id}/${user?.id}/${fileNameUpload}`;

        const { error: uploadError } = await supabase.storage
          .from("assignment-files")
          .upload(filePath, submissionFile);

        if (uploadError) {
          console.error("Error uploading submission file:", uploadError);
          alert("Error uploading file");
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("assignment-files").getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = submissionFile.name;
        fileSize = submissionFile.size;
        fileType = submissionFile.type;
      }

      const { data, error } = await supabase
        .from("submissions")
        .insert({
          assignment_id: selectedAssignment.id,
          student_id: user?.id,
          content: submissionText,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          file_type: fileType,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const updatedAssignments = assignments.map((assignment) => {
        if (assignment.id === selectedAssignment.id) {
          return {
            ...assignment,
            submissions: [
              ...(assignment.submissions || []),
              {
                ...data,
                student_name:
                  profile?.full_name && profile.full_name.trim() !== ""
                    ? profile.full_name
                    : "Anonymous User",
                student_email: profile?.email || "",
                student_avatar: profile?.avatar_url || null,
              },
            ],
          };
        }
        return assignment;
      });
      setAssignments(updatedAssignments);

      setSubmissionText("");
      setSubmissionFile(null);
      setShowSubmissionForm(false);
      setSelectedAssignment(null);

      alert("Assignment submitted successfully");
    } catch (error) {
      console.error("Error submitting assignment:", error);
      alert("Error submitting assignment");
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const gradeSubmission = async (
    submissionId: string,
    grade: number,
    feedback: string
  ) => {
    if (!confirm(`Are you sure you want to give the grade ${grade}?`)) {
      return;
    }

    setGradingSubmission(submissionId);

    try {
      const { error } = await supabase
        .from("submissions")
        .update({
          grade: grade,
          feedback: feedback,
          graded_at: new Date().toISOString(),
          graded_by: user?.id,
        })
        .eq("id", submissionId);

      if (error) throw error;

      // Update local state
      const updatedAssignments = assignments.map((assignment) => ({
        ...assignment,
        submissions:
          assignment.submissions?.map((submission) =>
            submission.id === submissionId
              ? {
                  ...submission,
                  grade,
                  feedback,
                  graded_at: new Date().toISOString(),
                  graded_by: user?.id,
                }
              : submission
          ) || [],
      }));
      setAssignments(updatedAssignments);

      alert("Assignment graded successfully");
    } catch (error) {
      console.error("Error grading submission:", error);
      alert("Error grading assignment");
    } finally {
      setGradingSubmission(null);
    }
  };

  const getUserSubmission = (assignment: Assignment) => {
    return assignment.submissions?.find((sub) => sub.student_id === user?.id);
  };

  const isAdmin = () => {
    return profile?.role === "admin";
  };

  const isProfessor = () => {
    // Admin has full permissions but is not considered a professor unless they have professor role
    // However, if there's no owner assigned yet, admin can act as professor temporarily
    if (profile?.role === "admin") {
      return true; // Admin has full permissions
    }
    return classData?.owner_id === user?.id || profile?.role === "Professor";
  };

  const removeMember = async (memberId: string, memberName: string) => {
    if (
      !confirm(`Are you sure you want to remove ${memberName} from this class?`)
    ) {
      return;
    }

    // Check if user is the class owner or admin
    if (classData?.owner_id !== user?.id && profile?.role !== "admin") {
      alert("Sorry, only the class owner or admin can remove members");
      return;
    }

    // Check if the member being removed is an admin (can't remove admin)
    const member = members.find(m => m.id === memberId);
    if (member?.profiles?.role === "admin") {
      alert("Cannot remove an administrator from the class");
      return;
    }

    setRemovingMember(memberId);

    try {
      const { error } = await supabase
        .from("class_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      // Update local state
      setMembers(members.filter((member) => member.id !== memberId));
      alert(`${memberName} has been removed from the class`);
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Error removing member from class");
    } finally {
      setRemovingMember(null);
    }
  };

  const changeMemberRole = async (memberId: string, memberName: string, newRole: string, memberUserId?: string) => {
    const action = newRole === "Professor" ? "promote" : "demote";
    if (
      !confirm(`Are you sure you want to ${action} ${memberName} to ${newRole === "Professor" ? "Professor" : "Student"}?`)
    ) {
      return;
    }

    // Check if user is the class owner or admin
    if (classData?.owner_id !== user?.id && profile?.role !== "admin") {
      alert("Sorry, only the class owner or admin can change member roles");
      return;
    }

    // Check if the member being modified is an admin (can't change admin roles)
    if (memberUserId) {
      const memberProfile = await supabase
        .from("profiles")
        .select("role")
        .eq("id", memberUserId)
        .single();

      if (memberProfile.data?.role === "admin") {
        alert("Cannot change the role of an administrator");
        return;
      }
    }

    setRemovingMember(memberId);

    try {
      const { error } = await supabase
        .from("class_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      // Update profiles table if the new role is different from current profile role
      if (memberUserId) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ role: newRole === "Professor" ? "professor" : "student" })
          .eq("id", memberUserId);

        if (profileError) {
          console.error("Error updating profile role:", profileError);
          // Continue with member update even if profile update fails
        }
      }

      // Update local state
      setMembers(members.map((member) =>
        member.id === memberId
          ? { ...member, role: newRole }
          : member
      ));

      alert(`${memberName} has been ${action}d to ${newRole === "Professor" ? "Professor" : "Student"}`);
    } catch (error) {
      console.error("Error changing member role:", error);
      alert("Error changing member role");
    } finally {
      setRemovingMember(null);
    }
  };

  const searchProfessors = async (email: string) => {
    if (!email.trim()) {
      setSearchedProfessors([]);
      return;
    }

    setSearchingProfessors(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .ilike("email", `%${email}%`)
        .neq("id", user?.id) // Exclude current user
        .limit(5);

      if (error) throw error;

      setSearchedProfessors(data || []);
    } catch (error) {
      console.error("Error searching professors:", error);
      alert("Error searching for professors");
    } finally {
      setSearchingProfessors(false);
    }
  };

  const assignProfessorAsOwner = async (professorId: string, professorName: string) => {
    if (!confirm(`Are you sure you want to assign ${professorName} as the main professor (owner) of this class?`)) {
      return;
    }

    // Check if user is admin
    if (profile?.role !== "admin") {
      alert("Sorry, only administrators can assign professors as class owners");
      return;
    }

    setAssigningProfessor(true);

    try {
      console.log("🔄 Starting professor assignment process...");
      console.log("👨‍🏫 Professor ID:", professorId);
      console.log("📚 Class ID:", classId);

      // Update class owner
      console.log("📝 Updating class owner...");
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .update({ owner_id: professorId })
        .eq("id", classId)
        .select();

      if (classError) {
        console.error("❌ Error updating class owner:", classError);
        throw classError;
      }

      console.log("✅ Class owner updated successfully:", classData);

      // Update professor role to professor if not already
      console.log("👨‍🏫 Updating professor role...");
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .update({ role: "professor" })
        .eq("id", professorId)
        .select();

      if (profileError) {
        console.error("❌ Error updating professor role:", profileError);
        // Continue even if role update fails
      } else {
        console.log("✅ Professor role updated successfully:", profileData);
      }

      // Update member role to professor if not already
      console.log("👥 Updating member role...");
      const { data: memberData, error: memberError } = await supabase
        .from("class_members")
        .update({ role: "professor" })
        .eq("class_id", classId)
        .eq("user_id", professorId)
        .select();

      if (memberError) {
        console.error("❌ Error updating member role:", memberError);
        // Continue even if member role update fails
      } else {
        console.log("✅ Member role updated successfully:", memberData);
      }

      // Update local state
      console.log("🔄 Updating local state...");
      setClassData(prev => prev ? { ...prev, owner_id: professorId } : null);

      // Fetch updated professor profile
      console.log("📥 Fetching updated professor profile...");
      const { data: professorData, error: professorFetchError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .eq("id", professorId)
        .single();

      if (!professorFetchError && professorData) {
        console.log("✅ Professor profile fetched successfully:", professorData);
        setProfessorProfile(professorData);
      } else {
        console.error("❌ Error fetching professor profile:", professorFetchError);
      }

      // Refresh class data to ensure consistency
      console.log("🔄 Refreshing class data...");
      await fetchClassData();

      setShowSettingsForm(false);
      setSearchProfessorEmail("");
      setSearchedProfessors([]);

      console.log("🎉 Professor assignment process completed successfully!");
      alert(`${professorName} has been assigned as the main professor of this class`);
    } catch (error) {
      console.error("❌ Error assigning professor:", error);
      alert(`Error assigning professor as class owner: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAssigningProfessor(false);
    }
  };

  const editPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editingPostContent.trim()) return;

    // Check if user is the class owner, professor, or admin
    if (classData?.owner_id !== user?.id && profile?.role !== "Professor" && profile?.role !== "admin") {
      alert("Sorry, only professors and admins can edit posts");
      return;
    }

    setEditingPostLoading(true);

    try {
      let fileUrls = editingPost.file_urls || [];
      let fileNames = editingPost.file_names || [];

      // Handle legacy single file format
      if (!editingPost.file_urls && editingPost.file_url) {
        fileUrls = [editingPost.file_url];
        fileNames = editingPost.file_name ? [editingPost.file_name] : [];
      }

      // Upload new files if selected
      if (editingPostFiles && editingPostFiles.length > 0) {
        const newFileUrls: string[] = [];
        const newFileNames: string[] = [];

        for (const file of editingPostFiles) {
          const fileExt = file.name.split(".").pop();
          const fileNameUpload = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${fileExt}`;
          const filePath = `posts/${classId}/${fileNameUpload}`;

          const { error: uploadError } = await supabase.storage
            .from("class-files")
            .upload(filePath, file);

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            alert(`Error uploading file: ${file.name}`);
            return;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("class-files").getPublicUrl(filePath);

          newFileUrls.push(publicUrl);
          newFileNames.push(file.name);

          // Insert file into files table
          const { error: fileInsertError } = await supabase
            .from("files")
            .insert({
              name: file.name,
              url: publicUrl,
              uploaded_by: user?.id,
              class_id: classId,
              assignment_id: null, // Not associated with an assignment
            });

          if (fileInsertError) {
            console.error("Error inserting file into files table:", fileInsertError);
            // Continue with other files even if one fails
          }
        }

        // Replace existing files with new ones
        fileUrls = newFileUrls;
        fileNames = newFileNames;
      }

      const { error } = await supabase
        .from("posts")
        .update({
          content: editingPostContent,
          file_urls: fileUrls.length > 0 ? fileUrls : null,
          file_names: fileNames.length > 0 ? fileNames : null,
        })
        .eq("id", editingPost.id);

      if (error) throw error;

      // Update local state
      setPosts(
        posts.map((post) =>
          post.id === editingPost.id
            ? {
                ...post,
                content: editingPostContent,
                file_urls: fileUrls.length > 0 ? fileUrls : undefined,
                file_names: fileNames.length > 0 ? fileNames : undefined,
              }
            : post
        )
      );

      setEditingPost(null);
      setEditingPostContent("");
      setEditingPostFiles([]);
      alert("Post edited successfully");
    } catch (error) {
      console.error("Error editing post:", error);
      alert("Error editing post");
    } finally {
      setEditingPostLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    // Check if user is the class owner, professor, or admin
    if (classData?.owner_id !== user?.id && profile?.role !== "Professor" && profile?.role !== "admin") {
      alert("Sorry, only professors and admins can delete posts");
      return;
    }

    try {
      // First, fetch the post data to get file information
      const { data: postData, error: fetchError } = await supabase
        .from("posts")
        .select("file_url, file_name, file_urls, file_names")
        .eq("id", postId)
        .single();

      if (fetchError) {
        console.error("❌ Error fetching post data:", fetchError);
        // Continue with deletion even if fetch fails
      }

      // Delete associated files from storage
      if (postData) {
        const filesToDelete = [];

        // Handle single file
        if (postData.file_url) {
          const filePath = postData.file_url.split('/').pop();
          if (filePath) {
            filesToDelete.push(`class-files/${classId}/${filePath}`);
          }
        }

        // Handle multiple files
        if (postData.file_urls && Array.isArray(postData.file_urls)) {
          postData.file_urls.forEach((fileUrl: string) => {
            const filePath = fileUrl.split('/').pop();
            if (filePath) {
              filesToDelete.push(`class-files/${classId}/${filePath}`);
            }
          });
        }

        console.log("🗂️ Files to delete:", filesToDelete);

        // Delete files from storage
        for (const filePath of filesToDelete) {
          try {
            console.log("🗑️ Deleting file:", filePath);
            const { error: storageError } = await supabase.storage
              .from("class-files")
              .remove([filePath]);

            if (storageError) {
              console.error(`❌ Error deleting file ${filePath}:`, storageError);
              // Continue with other files even if one fails
            } else {
              console.log(`✅ Successfully deleted file: ${filePath}`);
            }
          } catch (storageError) {
            console.error(`❌ Exception deleting file ${filePath}:`, storageError);
            // Continue with other files even if one fails
          }
        }
      }

      // Then delete the post from database
      console.log("🗑️ Deleting post from database...");
      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) {
        console.error("❌ Error deleting post from database:", error);
        throw error;
      }

      console.log("✅ Post deleted from database successfully");

      // Update local state
      console.log("🔄 Updating local state...");
      const updatedPosts = posts.filter((post) => post.id !== postId);
      setPosts(updatedPosts);
      console.log("📊 Local state updated. Posts count:", updatedPosts.length);

      alert("Post deleted successfully");
      console.log("🎉 Post deletion process completed successfully");
    } catch (error) {
      console.error("❌ Error deleting post:", error);
      alert("Error deleting post: " + (error as Error).message);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }

    // Check if user is the class owner, professor, or admin
    if (classData?.owner_id !== user?.id && profile?.role !== "Professor" && profile?.role !== "admin") {
      alert("Sorry, only professors and admins can delete questions");
      return;
    }

    setDeletingQuestion(questionId);

    try {
      // First delete all answers for this question
      const { error: answersError } = await supabase
        .from("answers")
        .delete()
        .eq("question_id", questionId);

      if (answersError) {
        console.error("Error deleting answers:", answersError);
        // Continue with question deletion even if answers deletion fails
      }

      // Then delete the question
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;

      // Update local state
      setQuestions(questions.filter((question) => question.id !== questionId));
      alert("Question deleted successfully");
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Error deleting question");
    } finally {
      setDeletingQuestion(null);
    }
  };

  const editAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment || !editingAssignmentData.title.trim()) return;

    // Check if user is the class owner or professor
    if (classData?.owner_id !== user?.id && profile?.role !== "Professor") {
      alert("Sorry, only professors can edit assignments");
      return;
    }

    setEditingAssignmentLoading(true);

    try {
      let fileUrl = editingAssignment.file_url;
      let fileName = editingAssignment.file_name;
      let fileSize = editingAssignment.file_size;
      let fileType = editingAssignment.file_type;

      // Upload new file if selected
      if (editingAssignmentFile) {
        const fileExt = editingAssignmentFile.name.split(".").pop();
        const fileNameUpload = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `assignments/${classId}/${fileNameUpload}`;

        const { error: uploadError } = await supabase.storage
          .from("assignment-files")
          .upload(filePath, editingAssignmentFile);

        if (uploadError) {
          console.error("Error uploading assignment file:", uploadError);
          alert("Error uploading file");
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("assignment-files").getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = editingAssignmentFile.name;
        fileSize = editingAssignmentFile.size;
        fileType = editingAssignmentFile.type;

        // Insert file into files table
        const { error: fileInsertError } = await supabase
          .from("files")
          .insert({
            name: editingAssignmentFile.name,
            url: publicUrl,
            uploaded_by: user?.id,
            class_id: classId,
            assignment_id: editingAssignment.id, // Associate with the assignment being edited
          });

        if (fileInsertError) {
          console.error("Error inserting file into files table:", fileInsertError);
          // Continue with assignment update even if file insertion fails
        }
      }

      // Combine date and time
      const dueDateTime = new Date(
        `${editingAssignmentData.dueDate}T${editingAssignmentData.dueTime}`
      );

      const { error } = await supabase
        .from("assignments")
        .update({
          title: editingAssignmentData.title,
          description: editingAssignmentData.description,
          due_at: dueDateTime.toISOString(),
          max_points: editingAssignmentData.maxPoints,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          file_type: fileType,
        })
        .eq("id", editingAssignment.id);

      if (error) throw error;

      // Update local state
      setAssignments(
        assignments.map((assignment) =>
          assignment.id === editingAssignment.id
            ? {
                ...assignment,
                title: editingAssignmentData.title,
                description: editingAssignmentData.description,
                due_at: dueDateTime.toISOString(),
                max_points: editingAssignmentData.maxPoints,
                file_url: fileUrl,
                file_name: fileName,
                file_size: fileSize,
                file_type: fileType,
              }
            : assignment
        )
      );

      setEditingAssignment(null);
      setEditingAssignmentData({
        title: "",
        description: "",
        dueDate: "",
        dueTime: "",
        maxPoints: 100,
      });
      setEditingAssignmentFile(null);
      alert("Assignment edited successfully");
    } catch (error) {
      console.error("Error editing assignment:", error);
      alert("Error editing assignment");
    } finally {
      setEditingAssignmentLoading(false);
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this assignment? All related submissions will be deleted."
      )
    ) {
      return;
    }

    // Check if user is the class owner, professor, or admin
    if (classData?.owner_id !== user?.id && profile?.role !== "Professor" && profile?.role !== "admin") {
      alert("Sorry, only professors and admins can delete assignments");
      return;
    }

    try {
      // First, fetch the assignment data to get file information
      const { data: assignmentData, error: fetchError } = await supabase
        .from("assignments")
        .select("file_url, file_name")
        .eq("id", assignmentId)
        .single();

      if (fetchError) {
        console.error("Error fetching assignment data:", fetchError);
        // Continue with deletion even if fetch fails
      }

      // Delete associated file from storage
      if (assignmentData?.file_url) {
        const filePath = assignmentData.file_url.split('/').pop();
        if (filePath) {
          try {
            const { error: storageError } = await supabase.storage
              .from("assignment-files")
              .remove([`assignments/${classId}/${filePath}`]);

            if (storageError) {
              console.error(`Error deleting assignment file ${filePath}:`, storageError);
              // Continue with deletion even if file deletion fails
            }
          } catch (storageError) {
            console.error(`Error deleting assignment file ${filePath}:`, storageError);
            // Continue with deletion even if file deletion fails
          }
        }
      }

      // First delete all submissions for this assignment
      const { error: submissionsError } = await supabase
        .from("submissions")
        .delete()
        .eq("assignment_id", assignmentId);

      if (submissionsError) {
        console.error("Error deleting submissions:", submissionsError);
        // Continue with assignment deletion even if submissions deletion fails
      }

      // Then delete the assignment
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      // Update local state
      setAssignments(
        assignments.filter((assignment) => assignment.id !== assignmentId)
      );
      alert("Assignment deleted successfully");
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Error deleting assignment");
    }
  };

  const createPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylist.title.trim()) return;

    // Check if user is the class owner, professor, or admin
    if (classData?.owner_id !== user?.id && profile?.role !== "Professor" && profile?.role !== "admin") {
      alert("Sorry, only professors and admins can create playlists");
      return;
    }

    setCreatingPlaylist(true);

    try {
      const { data, error } = await supabase
        .from("playlists")
        .insert({
          class_id: classId,
          title: newPlaylist.title,
          description: newPlaylist.description,
          created_by: user?.id,
          is_public: newPlaylist.isPublic,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setPlaylists([data, ...playlists]);
      setNewPlaylist({
        title: "",
        description: "",
        isPublic: false,
      });
      setShowPlaylistForm(false);

      alert("Playlist created successfully");
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert("Error creating playlist");
    } finally {
      setCreatingPlaylist(false);
    }
  };

  const fetchAvailableFiles = async () => {
    try {
      // Fetch files from the files table that belong to this class
      const { data: filesData, error: filesError } = await supabase
        .from("files")
        .select(`
          id,
          name,
          url,
          uploaded_by,
          class_id,
          assignment_id,
          created_at
        `)
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

      if (filesError) {
        console.error("Error fetching available files:", filesError);
        alert("Error fetching available files");
        return;
      }

      // Fetch files from posts that belong to this class
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          id,
          file_url,
          file_name,
          file_urls,
          file_names,
          created_at,
          author_id,
          profiles!posts_author_id_fkey(full_name)
        `)
        .eq("class_id", classId)
        .not("file_url", "is", null)
        .or("file_urls.not.is.null")
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching post files:", postsError);
        // Continue with files data even if posts fetch fails
      }

      // Process files into the expected format
      const files: AvailableFile[] = [];

      // Add files from the files table
      if (filesData) {
        filesData.forEach((file: FileRecord) => {
          files.push({
            id: file.id, // Use the actual UUID from the files table
            name: file.name,
            url: file.url,
            created_at: file.created_at,
            source: file.assignment_id ? "assignment" : "upload",
          });
        });
      }

      // Add files from posts
      if (postsData) {
        postsData.forEach((post: PostFile) => {
          // Handle single file format
          if (post.file_url && post.file_name) {
            files.push({
              id: `post-${post.id}-single`, // Create unique ID for post files
              name: post.file_name,
              url: post.file_url,
              created_at: post.created_at,
              source: "post",
              author_name: post.profiles?.full_name || "Unknown",
            });
          }

          // Handle multiple files format
          if (post.file_urls && Array.isArray(post.file_urls) && post.file_names && Array.isArray(post.file_names)) {
            post.file_urls.forEach((fileUrl: string, index: number) => {
              const fileName = post.file_names && Array.isArray(post.file_names) && post.file_names[index] 
                ? post.file_names[index] 
                : `File ${index + 1}`;
              files.push({
                id: `post-${post.id}-${index}`, // Create unique ID for each file in the post
                name: fileName,
                url: fileUrl,
                created_at: post.created_at,
                source: "post",
                author_name: post.profiles?.full_name || "Unknown",
              });
            });
          }
        });
      }

      // Remove duplicates based on URL
      const uniqueFiles = files.filter((file, index, self) =>
        index === self.findIndex(f => f.url === file.url)
      );

      // Sort by creation date (newest first)
      uniqueFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAvailableFiles(uniqueFiles);
    } catch (error) {
      console.error("Error fetching available files:", error);
      alert("Error fetching available files");
    }
  };

  const addFilesToPlaylist = async () => {
    if (!selectedPlaylist) return;

    // Check if we have either files to upload or files to select
    if (playlistFilesToUpload.length === 0 && selectedFilesForPlaylist.length === 0) return;

    setAddingFilesToPlaylist(true);

    try {
      // Get the current max position for this playlist
      const { data: existingFiles, error: fetchError } = await supabase
        .from("playlist_files")
        .select("position")
        .eq("playlist_id", selectedPlaylist.id)
        .order("position", { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error("Error fetching existing files:", fetchError);
      }

      const nextPosition = existingFiles && existingFiles.length > 0
        ? existingFiles[0].position + 1
        : 1;

      // First, upload new files if any
      const uploadedFileIds: string[] = [];

      if (playlistFilesToUpload.length > 0) {
        for (const file of playlistFilesToUpload) {
          const fileExt = file.name.split(".").pop();
          const fileNameUpload = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${fileExt}`;
          const filePath = `playlists/${classId}/${fileNameUpload}`;

          const { error: uploadError } = await supabase.storage
            .from("class-files")
            .upload(filePath, file);

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            alert(`Error uploading file ${file.name}`);
            return;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("class-files").getPublicUrl(filePath);

          // Insert file into files table
          const { data: fileData, error: fileInsertError } = await supabase
            .from("files")
            .insert({
              name: file.name,
              url: publicUrl,
              uploaded_by: user?.id,
              class_id: classId,
              assignment_id: null, // Not associated with an assignment
            })
            .select()
            .single();

          if (fileInsertError) {
            console.error("Error inserting file into files table:", fileInsertError);
            // Continue with other files even if one fails
          } else if (fileData) {
            uploadedFileIds.push(fileData.id);
          }
        }
      }

      // Combine uploaded file IDs with selected existing file IDs
      const allFileIdsToAdd = [...uploadedFileIds, ...selectedFilesForPlaylist];

      // Add all files to playlist
      const filesToInsert = allFileIdsToAdd.map((fileId, index) => ({
        playlist_id: selectedPlaylist.id,
        file_id: fileId,
        position: nextPosition + index,
      }));

      const { error } = await supabase
        .from("playlist_files")
        .insert(filesToInsert);

      if (error) throw error;

      // Refresh playlists data
      await fetchClassData();

      setShowAddFilesToPlaylist(false);
      setSelectedPlaylist(null);
      setSelectedFilesForPlaylist([]);
      setPlaylistFilesToUpload([]);

      alert(`${allFileIdsToAdd.length} file(s) added to playlist successfully`);
    } catch (error) {
      console.error("Error adding files to playlist:", error);
      alert("Error adding files to playlist");
    } finally {
      setAddingFilesToPlaylist(false);
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!confirm("Are you sure you want to delete this playlist? All files will be removed from the playlist.")) {
      return;
    }

    // Check if user is the class owner, professor, or admin
    if (classData?.owner_id !== user?.id && profile?.role !== "Professor" && profile?.role !== "admin") {
      alert("Sorry, only professors and admins can delete playlists");
      return;
    }

    try {
      // First delete all playlist files
      const { error: filesError } = await supabase
        .from("playlist_files")
        .delete()
        .eq("playlist_id", playlistId);

      if (filesError) {
        console.error("Error deleting playlist files:", filesError);
        // Continue with playlist deletion even if files deletion fails
      }

      // Then delete the playlist
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlistId);

      if (error) throw error;

      // Update local state
      setPlaylists(playlists.filter((playlist) => playlist.id !== playlistId));
      alert("Playlist deleted successfully");
    } catch (error) {
      console.error("Error deleting playlist:", error);
      alert("Error deleting playlist");
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <svg
              className="w-8 h-8 text-white animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Signing in...
          </h2>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Class not found
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t find the requested class
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg
                  className="w-5 sm:w-6 h-5 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent truncate">
                  {classData.name}
                </h1>
                <p className="text-sm text-slate-600 font-medium truncate">
                  {classData.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 border border-blue-200/50 shadow-sm flex-shrink-0">
                <span className="text-xs sm:text-sm text-slate-600 font-medium">
                  Join Code:
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 ml-2 bg-white/60 px-2 py-1 rounded-lg">
                  {classData.join_code}
                </span>
              </div>
              <button
                onClick={() => fetchClassData()}
                disabled={refreshingData}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl sm:rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
                title={refreshingData ? "Refreshing..." : "Refresh Class Data"}
              >
                {refreshingData ? (
                  <svg
                    className="w-4 sm:w-5 h-4 sm:h-5 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 sm:w-5 h-4 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
                <span className="hidden sm:inline ml-2 text-sm">
                  {refreshingData ? "Refreshing..." : "Refresh"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/60 p-4 sm:p-6 sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Dashboard
              </h2>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("posts")}
                  className={`w-full flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 rounded-2xl font-medium text-sm transition-all duration-300 group ${
                    activeTab === "posts"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transform scale-105"
                      : "text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-md"
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      activeTab === "posts"
                        ? "bg-white/20"
                        : "bg-blue-100 group-hover:bg-blue-200"
                    }`}
                  >
                    <svg
                      className="w-4 sm:w-5 h-4 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div className="text-right flex-1 mr-3">
                    <div className="font-semibold text-sm sm:text-base">
                      Posts
                    </div>
                    <div className="text-xs opacity-75">
                      Posts & Announcements
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("assignments")}
                  className={`w-full flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 rounded-2xl font-medium text-sm transition-all duration-300 group ${
                    activeTab === "assignments"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 transform scale-105"
                      : "text-slate-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:text-emerald-700 hover:shadow-md"
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      activeTab === "assignments"
                        ? "bg-white/20"
                        : "bg-emerald-100 group-hover:bg-emerald-200"
                    }`}
                  >
                    <svg
                      className="w-4 sm:w-5 h-4 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="text-right flex-1 mr-3">
                    <div className="font-semibold text-sm sm:text-base">
                      Assignments
                    </div>
                    <div className="text-xs opacity-75">
                      {assignments.length} assignment
                      {assignments.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("playlists")}
                  className={`w-full flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 rounded-2xl font-medium text-sm transition-all duration-300 group ${
                    activeTab === "playlists"
                      ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/25 transform scale-105"
                      : "text-slate-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 hover:text-pink-700 hover:shadow-md"
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      activeTab === "playlists"
                        ? "bg-white/20"
                        : "bg-pink-100 group-hover:bg-pink-200"
                    }`}
                  >
                    <svg
                      className="w-4 sm:w-5 h-4 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div className="text-right flex-1 mr-3">
                    <div className="font-semibold text-sm sm:text-base">
                      Playlists
                    </div>
                    <div className="text-xs opacity-75">
                      File Collections
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("questions")}
                  className={`w-full flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 rounded-2xl font-medium text-sm transition-all duration-300 group ${
                    activeTab === "questions"
                      ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/25 transform scale-105"
                      : "text-slate-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-700 hover:shadow-md"
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      activeTab === "questions"
                        ? "bg-white/20"
                        : "bg-orange-100 group-hover:bg-orange-200"
                    }`}
                  >
                    <svg
                      className="w-4 sm:w-5 h-4 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-right flex-1 mr-3">
                    <div className="font-semibold text-sm sm:text-base">
                      Questions
                    </div>
                    <div className="text-xs opacity-75">
                      {questions.length} question
                      {questions.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </button>

                {(classData.owner_id === user?.id ||
                  profile?.role === "admin") && (
                  <button
                    onClick={() => setActiveTab("members")}
                    className={`w-full flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 rounded-2xl font-medium text-sm transition-all duration-300 group ${
                      activeTab === "members"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 transform scale-105"
                        : "text-slate-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl transition-all duration-300 ${
                        activeTab === "members"
                          ? "bg-white/20"
                          : "bg-purple-100 group-hover:bg-purple-200"
                      }`}
                    >
                      <svg
                        className="w-4 sm:w-5 h-4 sm:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-right flex-1 mr-3">
                      <div className="font-semibold text-sm sm:text-base">
                        Students
                      </div>
                      <div className="text-xs opacity-75">
                        {members.length} student
                        {members.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </button>
                )}
              </nav>

              {/* Quick Stats */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200/60">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 sm:mb-4">
                  Quick Stats
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Questions</span>
                    <span className="text-sm font-bold text-slate-900">
                      {questions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Assignments</span>
                    <span className="text-sm font-bold text-slate-900">
                      {assignments.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Students</span>
                    <span className="text-sm font-bold text-slate-900">
                      {members.length}
                    </span>
                  </div>
                </div>

                {/* Admin Settings */}
                {profile?.role === "admin" && (
                  <div className="mt-4 pt-4 border-t border-slate-200/60">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">
                      Admin Settings
                    </h4>
                    <button
                      onClick={() => setShowSettingsForm(true)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
                    >
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-sm">Assign Main Professor</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Professor Profile */}
              {(professorProfile || members.filter(member => member.role === "professor").length > 0 || (profile?.role === "admin" && !professorProfile)) && (
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200/60">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Class Professors
                  </h3>

                  {/* No Main Professor Assigned - Show for Admins */}
                  {profile?.role === "admin" && !professorProfile && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-200/50 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <svg
                              className="w-5 h-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              No Main Professor Assigned
                            </h4>
                            <p className="text-xs text-slate-600">
                              Assign a main professor to manage this class
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowSettingsForm(true)}
                          className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
                        >
                          Assign Professor
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Main Professor */}
                  {professorProfile && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200/50 mb-4">
                      <div className="flex items-center space-x-3">
                        {professorProfile.avatar_url ? (
                          <img
                            src={professorProfile.avatar_url}
                            alt={professorProfile.full_name || "Professor"}
                            className="w-12 h-12 rounded-2xl object-cover shadow-lg border-2 border-white"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {(professorProfile.full_name || "P").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {professorProfile.full_name || "Professor"}
                          </h4>
                          <p className="text-xs text-slate-600 truncate">
                            {professorProfile.email}
                          </p>
                          <div className="flex items-center mt-1">
                            <span className="inline-flex px-2 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800">
                              Professor
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assistant Professors */}
                  {members.filter(member => member.role === "professor" && member.user_id !== classData?.owner_id).map((assistantProfessor) => (
                    <div key={assistantProfessor.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200/50 mb-4">
                      <div className="flex items-center space-x-3">
                        {assistantProfessor.profiles?.avatar_url ? (
                          <img
                            src={assistantProfessor.profiles.avatar_url}
                            alt={assistantProfessor.profiles?.full_name || "Assistant Professor"}
                            className="w-12 h-12 rounded-2xl object-cover shadow-lg border-2 border-white"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {(assistantProfessor.profiles?.full_name || "A").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {assistantProfessor.profiles?.full_name || "Assistant Professor"}
                          </h4>
                          <p className="text-xs text-slate-600 truncate">
                            {assistantProfessor.profiles?.email || ""}
                          </p>
                          <div className="flex items-center mt-1">
                            <span className="inline-flex px-2 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">
                              Professor
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Posts Tab */}
            {activeTab === "posts" && (
              <div className="space-y-6">
                {(classData.owner_id === user?.id || profile?.role === "admin") && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowPostForm(true)}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                    >
                      <svg
                        className="w-5 h-5 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      New Post
                    </button>
                  </div>
                )}

                {showPostForm && (classData.owner_id === user?.id || profile?.role === "admin") && (
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Add New Post
                      </h3>
                      <button
                        onClick={() => setShowPostForm(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={createPost} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Post Content
                        </label>
                        <textarea
                          value={newPost}
                          onChange={(e) => setNewPost(e.target.value)}
                          className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none bg-slate-50/50"
                          rows={5}
                          placeholder="Write your post here..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Attach Files (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            multiple
                            onChange={(e) =>
                              setSelectedFiles(Array.from(e.target.files || []))
                            }
                            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                            className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-50 file:to-indigo-50 file:text-blue-700 hover:file:from-blue-100 hover:file:to-indigo-100 bg-slate-50/50"
                          />
                          {selectedFiles && selectedFiles.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-sm text-slate-600 font-medium">Selected files:</p>
                              {selectedFiles.map((file, index) => (
                                <div key={index} className="text-sm text-slate-600 bg-blue-50 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                                  <span>
                                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newFiles = selectedFiles.filter((_, i) => i !== index);
                                      setSelectedFiles(newFiles);
                                    }}
                                    className="text-red-500 hover:text-red-700 ml-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          You can upload multiple images, PDF files, Word documents, or compressed files (Max size: 10MB per file, Max 5 files)
                        </p>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPostForm(false);
                            setSelectedFiles([]);
                          }}
                          className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all duration-300"
                          disabled={uploadingFile}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          disabled={uploadingFile}
                        >
                          {uploadingFile && (
                            <svg
                              className="w-5 h-5 animate-spin"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          )}
                          <span>
                            {uploadingFile ? "Publishing..." : "Publish Post"}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Edit Post Form */}
                {editingPost && (
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Edit Post
                      </h3>
                      <button
                        onClick={() => {
                          setEditingPost(null);
                          setEditingPostContent("");
                          setEditingPostFiles([]);
                        }}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={editPost} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Post Content
                        </label>
                        <textarea
                          value={editingPostContent}
                          onChange={(e) =>
                            setEditingPostContent(e.target.value)
                          }
                          className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none bg-slate-50/50"
                          rows={6}
                          placeholder="Write post content here..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Attach File (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            multiple
                            onChange={(e) =>
                              setEditingPostFiles(Array.from(e.target.files || []))
                            }
                            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                            className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-50 file:to-indigo-50 file:text-blue-700 hover:file:from-blue-100 hover:file:to-indigo-100 bg-slate-50/50"
                          />
                          {editingPostFiles && editingPostFiles.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-sm text-slate-600 font-medium">New files to upload:</p>
                              {editingPostFiles.map((file, index) => (
                                <div key={index} className="text-sm text-slate-600 bg-blue-50 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                                  <span>
                                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newFiles = editingPostFiles.filter((_, i) => i !== index);
                                      setEditingPostFiles(newFiles);
                                    }}
                                    className="text-red-500 hover:text-red-700 ml-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {(editingPost.file_urls && editingPost.file_urls.length > 0) ||
                           (editingPost.file_url) && (
                            <div className="mt-3 space-y-2">
                              <p className="text-sm text-slate-600 font-medium">Current files:</p>
                              {(editingPost.file_urls || (editingPost.file_url ? [editingPost.file_url] : [])).map((fileUrl, index) => (
                                <div key={index} className="text-sm text-blue-600 bg-blue-50 p-3 rounded-xl border border-blue-200">
                                  {(editingPost.file_names || (editingPost.file_name ? [editingPost.file_name] : []))[index] || 'File'} - Will be kept if no new files are selected
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          You can upload multiple images, PDF files, Word documents, or compressed files (Max size: 10MB per file, Max 5 files)
                        </p>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPost(null);
                            setEditingPostContent("");
                            setEditingPostFiles([]);
                          }}
                          className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all duration-300"
                          disabled={editingPostLoading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          disabled={editingPostLoading}
                        >
                          {editingPostLoading && (
                            <svg
                              className="w-5 h-5 animate-spin"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          )}
                          <span>
                            {editingPostLoading ? "Updating..." : "Update Post"}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-6">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/60 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          {post.author_avatar ? (
                            <img
                              src={post.author_avatar}
                              alt={post.author_name}
                              className="w-14 h-14 rounded-3xl object-cover shadow-lg border-2 border-white"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold text-xl">
                                {post.author_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-slate-900 text-lg">
                              {post.author_name}
                            </h4>
                            <p className="text-sm text-slate-500 font-medium">
                              {new Date(post.created_at).toLocaleString(
                                "ar-SA"
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Edit and Delete buttons for class owner or admin */}
                        {(classData?.owner_id === user?.id || profile?.role === "admin") && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingPost(post);
                                setEditingPostContent(post.content);
                                setEditingPostFiles([]);
                              }}
                              className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-200 transition-all duration-300 shadow-md hover:shadow-lg"
                              title="Edit Post"
                            >
                              <svg
                                className="w-4 h-4 ml-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => deletePost(post.id)}
                              className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 transition-all duration-300 shadow-md hover:shadow-lg"
                              title="Delete Post"
                            >
                              <svg
                                className="w-4 h-4 ml-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>

                      {/* Display files if they exist */}
                      {((Array.isArray(post.file_urls) && post.file_urls.length > 0) || post.file_url) && (
                        <div className="mt-6 space-y-4">
                          {(() => {
                            console.log("📎 Displaying files for post:", post.id, "file_urls:", post.file_urls, "file_names:", post.file_names);
                            return null;
                          })()}
                          {(Array.isArray(post.file_urls) && post.file_urls.length > 0 
                            ? post.file_urls 
                            : (post.file_url ? [post.file_url] : [])).map((fileUrl, index) => (
                            <div key={index} className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                                  {((post.file_names || (post.file_name ? [post.file_name] : []))[index] || '')
                                    ?.toLowerCase()
                                    .endsWith(".pdf") && (
                                    <svg
                                      className="w-6 h-6 text-red-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                  )}
                                  {((post.file_names || (post.file_name ? [post.file_name] : []))[index] || '')
                                    ?.toLowerCase()
                                    .match(/\.(doc|docx)$/) && (
                                    <svg
                                      className="w-6 h-6 text-blue-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                  )}
                                  {((post.file_names || (post.file_name ? [post.file_name] : []))[index] || '')
                                    ?.toLowerCase()
                                    .match(/\.(jpg|jpeg|png|gif)$/) && (
                                    <svg
                                      className="w-6 h-6 text-green-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                  )}
                                  {!((post.file_names || (post.file_name ? [post.file_name] : []))[index] || '').match(
                                    /\.(pdf|doc|docx|jpg|jpeg|png|gif|zip)$/
                                  ) && (
                                    <svg
                                      className="w-6 h-6 text-slate-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-slate-900">
                                    {Array.isArray(post.file_names) && post.file_names.length > 0 
                                      ? post.file_names[index] 
                                      : (post.file_name || 'File')}
                                  </p>
                                  <p className="text-xs text-slate-500">ملف مرفق</p>
                                </div>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                >
                                  <svg
                                    className="w-4 h-4 ml-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  download{" "}
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {posts.length === 0 && (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-3xl mb-6">
                        <svg
                          className="w-12 h-12 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">
                        No Posts Yet
                      </h3>
                      {classData.owner_id === user?.id ? (
                        <>
                          <p className="text-slate-600 mb-8 text-lg">
                            Start the conversation by adding a new post
                          </p>
                          <button
                            onClick={() => setShowPostForm(true)}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-bold rounded-3xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                          >
                            <svg
                              className="w-6 h-6 ml-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            Create First Post
                          </button>
                        </>
                      ) : (
                        <p className="text-slate-600 text-lg">
                          Posts will be published by the professor soon
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assignments Tab */}
            {activeTab === "assignments" && (
              <div className="space-y-6">
                {isProfessor() && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowAssignmentForm(true)}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                    >
                      <svg
                        className="w-5 h-5 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      New Assignment
                    </button>
                  </div>
                )}

                {showAssignmentForm && isProfessor() && (
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Add New Assignment
                      </h3>
                      <button
                        onClick={() => setShowAssignmentForm(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={createAssignment} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Assignment Title *
                          </label>
                          <input
                            type="text"
                            value={newAssignment.title}
                            onChange={(e) =>
                              setNewAssignment({
                                ...newAssignment,
                                title: e.target.value,
                              })
                            }
                            className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-slate-50/50"
                            placeholder="Enter assignment title"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Maximum Points
                          </label>
                          <input
                            type="number"
                            value={newAssignment.maxPoints}
                            onChange={(e) =>
                              setNewAssignment({
                                ...newAssignment,
                                maxPoints: parseInt(e.target.value) || 100,
                              })
                            }
                            className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-slate-50/50"
                            min="1"
                            max="1000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Assignment Description
                        </label>
                        <textarea
                          value={newAssignment.description}
                          onChange={(e) =>
                            setNewAssignment({
                              ...newAssignment,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 resize-none bg-slate-50/50"
                          rows={4}
                          placeholder="اكتب وصفاً مفصلاً للواجب..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Due Date *
                          </label>
                          <input
                            type="date"
                            value={newAssignment.dueDate}
                            onChange={(e) =>
                              setNewAssignment({
                                ...newAssignment,
                                dueDate: e.target.value,
                              })
                            }
                            className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-slate-50/50"
                            min={new Date().toISOString().split("T")[0]}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Due Time *
                          </label>
                          <input
                            type="time"
                            value={newAssignment.dueTime}
                            onChange={(e) =>
                              setNewAssignment({
                                ...newAssignment,
                                dueTime: e.target.value,
                              })
                            }
                            className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-slate-50/50"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Attach File (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            onChange={(e) =>
                              setAssignmentFile(e.target.files?.[0] || null)
                            }
                            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                            className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-emerald-50 file:to-teal-50 file:text-emerald-700 hover:file:from-emerald-100 hover:file:to-teal-100 bg-slate-50/50"
                          />
                          {assignmentFile && (
                            <div className="mt-3 text-sm text-slate-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                              Selected file: {assignmentFile.name} (
                              {(assignmentFile.size / 1024 / 1024).toFixed(2)}{" "}
                              MB)
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          يمكنك رفع ملفات PDF، مستندات Word، صور، أو ملفات
                          مضغوطة (حجم أقصى: 50MB)
                        </p>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAssignmentForm(false);
                            setNewAssignment({
                              title: "",
                              description: "",
                              dueDate: "",
                              dueTime: "",
                              maxPoints: 100,
                            });
                            setAssignmentFile(null);
                          }}
                          className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all duration-300"
                          disabled={creatingAssignment}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          disabled={creatingAssignment}
                        >
                          {creatingAssignment && (
                            <svg
                              className="w-5 h-5 animate-spin"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          )}
                          <span>
                            {creatingAssignment
                              ? "Creating..."
                              : "Create Assignment"}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Edit Assignment Form */}
                {editingAssignment && (
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Edit Assignment
                      </h3>
                      <button
                        onClick={() => {
                          setEditingAssignment(null);
                          setEditingAssignmentData({
                            title: "",
                            description: "",
                            dueDate: "",
                            dueTime: "",
                            maxPoints: 100,
                          });
                          setEditingAssignmentFile(null);
                        }}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={editAssignment} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Assignment Title *
                          </label>
                          <input
                            type="text"
                            value={editingAssignmentData.title}
                            onChange={(e) =>
                              setEditingAssignmentData({
                                ...editingAssignmentData,
                                title: e.target.value,
                              })
                            }
                            className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-slate-50/50"
                            placeholder="Enter assignment title"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Maximum Points
                          </label>
                          <input
                            type="number"
                            value={editingAssignmentData.maxPoints}
                            onChange={(e) =>
                              setEditingAssignmentData({
                                ...editingAssignmentData,
                                maxPoints: parseInt(e.target.value) || 100,
                              })
                            }
                            className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-slate-50/50"
                            min="1"
                            max="1000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Assignment Description
                        </label>
                        <textarea
                          value={editingAssignmentData.description}
                          onChange={(e) =>
                            setEditingAssignmentData({
                              ...editingAssignmentData,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 resize-none bg-slate-50/50"
                          rows={4}
                          placeholder="اكتب وصفاً مفصلاً للواجب..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Due Date *
                          </label>
                          <input
                            type="date"
                            value={editingAssignmentData.dueDate}
                            onChange={(e) =>
                              setEditingAssignmentData({
                                ...editingAssignmentData,
                                dueDate: e.target.value,
                              })
                            }
                            className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-slate-50/50"
                            min={new Date().toISOString().split("T")[0]}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Due Time *
                          </label>
                          <input
                            type="time"
                            value={editingAssignmentData.dueTime}
                            onChange={(e) =>
                              setEditingAssignmentData({
                                ...editingAssignmentData,
                                dueTime: e.target.value,
                              })
                            }
                            className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-slate-50/50"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Attach File (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            onChange={(e) =>
                              setEditingAssignmentFile(
                                e.target.files?.[0] || null
                              )
                            }
                            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                            className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-emerald-50 file:to-teal-50 file:text-emerald-700 hover:file:from-emerald-100 hover:file:to-teal-100 bg-slate-50/50"
                          />
                          {editingAssignmentFile && (
                            <div className="mt-3 text-sm text-slate-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                              New file selected: {editingAssignmentFile.name} (
                              {(
                                editingAssignmentFile.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB)
                            </div>
                          )}
                          {editingAssignment.file_url &&
                            !editingAssignmentFile && (
                              <div className="mt-3 text-sm text-blue-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                                Current file: {editingAssignment.file_name} -
                                Will be kept if no new file is selected
                              </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          يمكنك رفع ملفات PDF، مستندات Word، صور، أو ملفات
                          مضغوطة (حجم أقصى: 50MB)
                        </p>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAssignment(null);
                            setEditingAssignmentData({
                              title: "",
                              description: "",
                              dueDate: "",
                              dueTime: "",
                              maxPoints: 100,
                            });
                            setEditingAssignmentFile(null);
                          }}
                          className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all duration-300"
                          disabled={editingAssignmentLoading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          disabled={editingAssignmentLoading}
                        >
                          {editingAssignmentLoading && (
                            <svg
                              className="w-5 h-5 animate-spin"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          )}
                          <span>
                            {editingAssignmentLoading
                              ? "Updating..."
                              : "Update Assignment"}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-6">
                  {assignments.map((assignment) => {
                    const userSubmission = getUserSubmission(assignment);
                    const isOverdue = new Date(assignment.due_at) < new Date();
                    const isSubmitted = !!userSubmission;

                    return (
                      <div
                        key={assignment.id}
                        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/60 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                                {assignment.title}
                              </h3>

                              {/* Edit and Delete buttons for professors */}
                              {isProfessor() && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingAssignment(assignment);
                                      setEditingAssignmentData({
                                        title: assignment.title,
                                        description:
                                          assignment.description || "",
                                        dueDate: new Date(assignment.due_at)
                                          .toISOString()
                                          .split("T")[0],
                                        dueTime: new Date(assignment.due_at)
                                          .toTimeString()
                                          .slice(0, 5),
                                        maxPoints: assignment.max_points,
                                      });
                                      setEditingAssignmentFile(null);
                                    }}
                                    className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-200 transition-all duration-300 shadow-md hover:shadow-lg"
                                    title="Edit Assignment"
                                  >
                                    <svg
                                      className="w-4 h-4 ml-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteAssignment(assignment.id)
                                    }
                                    className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 transition-all duration-300 shadow-md hover:shadow-lg"
                                    title="Delete Assignment"
                                  >
                                    <svg
                                      className="w-4 h-4 ml-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>

                            {assignment.description && (
                              <p className="text-slate-600 mb-4 leading-relaxed text-lg">
                                {assignment.description}
                              </p>
                            )}

                            <div className="flex items-center space-x-6 text-sm text-slate-500 mb-4">
                              <div className="flex items-center space-x-2">
                                <svg
                                  className="w-5 h-5 text-slate-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span className="font-medium">
                                  Due Date:{" "}
                                  {new Date(assignment.due_at).toLocaleString(
                                    "ar-SA"
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <svg
                                  className="w-5 h-5 text-slate-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span className="font-medium">
                                  Maximum Points: {assignment.max_points}
                                </span>
                              </div>
                            </div>

                            {/* Assignment file */}
                            {assignment.file_url && (
                              <div className="mb-6 p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                                    {assignment.file_name
                                      ?.toLowerCase()
                                      .endsWith(".pdf") && (
                                      <svg
                                        className="w-6 h-6 text-red-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                    )}
                                    {assignment.file_name
                                      ?.toLowerCase()
                                      .match(/\.(doc|docx)$/) && (
                                      <svg
                                        className="w-6 h-6 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                    )}
                                    {assignment.file_name
                                      ?.toLowerCase()
                                      .match(/\.(jpg|jpeg|png|gif)$/) && (
                                      <svg
                                        className="w-6 h-6 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                    )}
                                    {!assignment.file_name?.match(
                                      /\.(pdf|doc|docx|jpg|jpeg|png|gif|zip)$/
                                    ) && (
                                      <svg
                                        className="w-6 h-6 text-slate-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900">
                                      {assignment.file_name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Assignment File
                                    </p>
                                  </div>
                                  <a
                                    href={assignment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                  >
                                    <svg
                                      className="w-4 h-4 ml-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                    Download
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="text-left">
                            <div
                              className={`inline-flex px-4 py-2 text-sm font-bold rounded-2xl ${
                                isOverdue && !isSubmitted
                                  ? "bg-red-100 text-red-800"
                                  : isSubmitted
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {isOverdue && !isSubmitted
                                ? "Overdue"
                                : isSubmitted
                                ? "Submitted"
                                : "On Time"}
                            </div>
                          </div>
                        </div>

                        {/* Submission status for students */}
                        {!isProfessor() && (
                          <div className="border-t border-slate-200 pt-6">
                            {userSubmission ? (
                              <div className="bg-emerald-50 rounded-2xl p-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-bold text-emerald-900 text-lg">
                                      Assignment Submitted
                                    </h4>
                                    <p className="text-sm text-emerald-700 font-medium">
                                      Submission Date:{" "}
                                      {new Date(
                                        userSubmission.submitted_at
                                      ).toLocaleString("ar-SA")}
                                    </p>
                                    {userSubmission.file_url && (
                                      <p className="text-sm text-emerald-700 font-medium">
                                        File Uploaded:{" "}
                                        {userSubmission.file_name}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-left">
                                    {userSubmission.grade !== undefined ? (
                                      <div className="text-3xl font-bold text-emerald-600">
                                        {userSubmission.grade}/
                                        {assignment.max_points}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-yellow-600 font-semibold">
                                        Awaiting Grading
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {userSubmission.feedback && (
                                  <div className="mt-4 p-4 bg-white rounded-2xl">
                                    <h5 className="font-bold text-slate-900 mb-2">
                                      Professor&apos;s Comment:
                                    </h5>
                                    <p className="text-sm text-slate-700">
                                      {userSubmission.feedback}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-bold text-slate-900 text-lg">
                                    Assignment Not Submitted Yet
                                  </h4>
                                  <p className="text-sm text-slate-600 font-medium">
                                    {isOverdue
                                      ? "Submission Deadline Has Passed"
                                      : "You can submit the assignment now"}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedAssignment(assignment);
                                    setShowSubmissionForm(true);
                                  }}
                                  disabled={isOverdue}
                                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isOverdue
                                    ? "Deadline Passed"
                                    : "Submit Assignment"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Professor view - submissions list */}
                        {isProfessor() &&
                          assignment.submissions &&
                          assignment.submissions.length > 0 && (
                            <div className="border-t border-slate-200 pt-6">
                              <h4 className="font-bold text-slate-900 mb-6 text-xl">
                                Student Submissions (
                                {assignment.submissions.length})
                              </h4>
                              <div className="space-y-4">
                                {assignment.submissions.map((submission) => (
                                  <div
                                    key={submission.id}
                                    className="bg-slate-50 rounded-2xl p-6"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-4">
                                        {submission.student_avatar ? (
                                          <img
                                            src={submission.student_avatar}
                                            alt={submission.student_name || "Student"}
                                            className="w-12 h-12 rounded-2xl object-cover shadow-lg border-2 border-white"
                                          />
                                        ) : (
                                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                            <span className="text-white font-bold text-lg">
                                              {(submission.student_name || "Anonymous")
                                                .charAt(0)
                                                .toUpperCase()}
                                            </span>
                                          </div>
                                        )}
                                        <div>
                                          <h5 className="font-bold text-slate-900 text-lg">
                                            {submission.student_name || "Anonymous Student"}
                                          </h5>
                                          <p className="text-sm text-slate-600 font-medium">
                                            Submitted:{" "}
                                            {new Date(
                                              submission.submitted_at
                                            ).toLocaleString("ar-SA")}
                                          </p>
                                          {submission.file_url && (
                                            <p className="text-sm text-slate-600 font-medium">
                                              Attached File:{" "}
                                              {submission.file_name}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-left">
                                        {submission.grade !== undefined ? (
                                          <div className="text-xl font-bold text-emerald-600">
                                            {submission.grade}/
                                            {assignment.max_points}
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              const grade = prompt(
                                                `Enter grade for student ${submission.student_name || "Anonymous Student"} (0 to ${assignment.max_points}):`
                                              );
                                              const feedback = prompt(
                                                "Enter comment (optional):"
                                              );
                                              if (grade !== null) {
                                                const gradeNum =
                                                  parseInt(grade);
                                                if (
                                                  !isNaN(gradeNum) &&
                                                  gradeNum >= 0 &&
                                                  gradeNum <=
                                                    assignment.max_points
                                                ) {
                                                  gradeSubmission(
                                                    submission.id,
                                                    gradeNum,
                                                    feedback || ""
                                                  );
                                                } else {
                                                  alert(
                                                    `يجب أن تكون الدرجة بين 0 و ${assignment.max_points}`
                                                  );
                                                }
                                              }
                                            }}
                                            disabled={
                                              gradingSubmission ===
                                              submission.id
                                            }
                                            className="px-4 py-2 bg-yellow-600 text-white text-sm font-bold rounded-xl hover:bg-yellow-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                          >
                                            {gradingSubmission === submission.id
                                              ? "Grading..."
                                              : "Grade"}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    {submission.feedback && (
                                      <div className="mt-4 p-4 bg-white rounded-2xl">
                                        <p className="text-sm text-slate-700">
                                          {submission.feedback}
                                        </p>
                                      </div>
                                    )}
                                    {submission.file_url && (
                                      <div className="mt-4">
                                        <a
                                          href={submission.file_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                        >
                                          <svg
                                            className="w-4 h-4 ml-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                          </svg>
                                          View Uploaded File
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Professor view - no submissions */}
                        {isProfessor() &&
                          (!assignment.submissions ||
                            assignment.submissions.length === 0) && (
                            <div className="border-t border-slate-200 pt-6">
                              <div className="text-center py-8">
                                <svg
                                  className="w-12 h-12 text-slate-400 mx-auto mb-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                <p className="text-slate-500 text-lg font-medium">
                                  No students have submitted this assignment yet
                                </p>
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  })}

                  {assignments.length === 0 && (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-3xl mb-6">
                        <svg
                          className="w-12 h-12 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">
                        No Assignments
                      </h3>
                      {isProfessor() ? (
                        <>
                          <p className="text-slate-600 mb-8 text-lg">
                            Start by creating a new assignment for your students
                          </p>
                          <button
                            onClick={() => setShowAssignmentForm(true)}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-3xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                          >
                            <svg
                              className="w-6 h-6 ml-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Create First Assignment
                          </button>
                        </>
                      ) : (
                        <p className="text-slate-600 text-lg">
                          Assignments will be published by the professor soon
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Submission Form Modal */}
                {showSubmissionForm && selectedAssignment && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Submit Assignment: {selectedAssignment.title}
                          </h3>
                          <button
                            onClick={() => {
                              setShowSubmissionForm(false);
                              setSelectedAssignment(null);
                              setSubmissionText("");
                              setSubmissionFile(null);
                            }}
                            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>

                        <form onSubmit={submitAssignment} className="space-y-6">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">
                              Answer Text (Optional)
                            </label>
                            <textarea
                              value={submissionText}
                              onChange={(e) =>
                                setSubmissionText(e.target.value)
                              }
                              className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none bg-slate-50/50"
                              rows={4}
                              placeholder="Write your answer here..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">
                              Attach File (Optional)
                            </label>
                            <div className="relative">
                              <input
                                type="file"
                                onChange={(e) =>
                                  setSubmissionFile(e.target.files?.[0] || null)
                                }
                                accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                                className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-50 file:to-indigo-50 file:text-blue-700 hover:file:from-blue-100 hover:file:to-indigo-100 bg-slate-50/50"
                              />
                              {submissionFile && (
                                <div className="mt-3 text-sm text-slate-600 bg-blue-50 p-3 rounded-xl border border-blue-200">
                                  Selected file: {submissionFile.name} (
                                  {(submissionFile.size / 1024 / 1024).toFixed(
                                    2
                                  )}{" "}
                                  MB)
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                              يمكنك رفع ملفات PDF، مستندات Word، صور، أو ملفات
                              مضغوطة (حجم أقصى: 50MB)
                            </p>
                          </div>

                          <div className="bg-yellow-50 rounded-2xl p-6 mb-6">
                            <div className="flex items-center space-x-3">
                              <svg
                                className="w-6 h-6 text-yellow-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                              </svg>
                              <div>
                                <h4 className="font-bold text-yellow-900">
                                  Reminder
                                </h4>
                                <p className="text-sm text-yellow-700 font-medium">
                                  Submission Deadline:{" "}
                                  {new Date(
                                    selectedAssignment.due_at
                                  ).toLocaleString("ar-SA")}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-4">
                            <button
                              type="button"
                              onClick={() => {
                                setShowSubmissionForm(false);
                                setSelectedAssignment(null);
                                setSubmissionText("");
                                setSubmissionFile(null);
                              }}
                              className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all duration-300"
                              disabled={submittingAssignment}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                              disabled={submittingAssignment}
                            >
                              {submittingAssignment && (
                                <svg
                                  className="w-5 h-5 animate-spin"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                              )}
                              <span>
                                {submittingAssignment
                                  ? "Submitting..."
                                  : "Submit Assignment"}
                              </span>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Playlists Tab */}
            {activeTab === "playlists" && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  {(classData?.owner_id === user?.id || profile?.role === "professor") && (
                    <button
                      onClick={() => setShowPlaylistForm(true)}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold rounded-2xl hover:from-pink-700 hover:to-rose-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                    >
                      <svg
                        className="w-5 h-5 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Create Playlist
                    </button>
                  )}
                </div>

                {/* Create Playlist Form */}
                {showPlaylistForm && (
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Create New Playlist
                      </h3>
                      <button
                        onClick={() => setShowPlaylistForm(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={createPlaylist} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Playlist Title *
                        </label>
                        <input
                          type="text"
                          value={newPlaylist.title}
                          onChange={(e) =>
                            setNewPlaylist({
                              ...newPlaylist,
                              title: e.target.value,
                            })
                          }
                          className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300 bg-slate-50/50"
                          placeholder="Enter playlist title"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Description (Optional)
                        </label>
                        <textarea
                          value={newPlaylist.description}
                          onChange={(e) =>
                            setNewPlaylist({
                              ...newPlaylist,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300 resize-none bg-slate-50/50"
                          rows={3}
                          placeholder="Describe what this playlist contains..."
                        />
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="isPublic"
                          checked={newPlaylist.isPublic}
                          onChange={(e) =>
                            setNewPlaylist({
                              ...newPlaylist,
                              isPublic: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-pink-600 bg-slate-100 border-slate-300 rounded focus:ring-pink-500 focus:ring-2"
                        />
                        <label
                          htmlFor="isPublic"
                          className="text-sm font-medium text-slate-700"
                        >
                          Make playlist public (visible to all class members)
                        </label>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPlaylistForm(false);
                            setNewPlaylist({
                              title: "",
                              description: "",
                              isPublic: false,
                            });
                          }}
                          className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all duration-300"
                          disabled={creatingPlaylist}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold rounded-2xl hover:from-pink-700 hover:to-rose-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          disabled={creatingPlaylist}
                        >
                          {creatingPlaylist && (
                            <svg
                              className="w-5 h-5 animate-spin"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          )}
                          <span>
                            {creatingPlaylist
                              ? "Creating..."
                              : "Create Playlist"}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Add Files to Playlist Modal */}
                {showAddFilesToPlaylist && selectedPlaylist && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Add Files to &quot;{selectedPlaylist.title}&quot;
                          </h3>
                          <button
                            onClick={() => {
                              setShowAddFilesToPlaylist(false);
                              setSelectedPlaylist(null);
                              setSelectedFilesForPlaylist([]);
                              setPlaylistFilesToUpload([]);
                            }}
                            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className="space-y-6">
                          {/* Upload New Files Section */}
                          <div>
                            <h4 className="text-lg font-semibold text-slate-900 mb-4">
                              Upload New Files
                            </h4>
                            <div className="relative">
                              <input
                                type="file"
                                multiple
                                onChange={(e) =>
                                  setPlaylistFilesToUpload(Array.from(e.target.files || []))
                                }
                                accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                                className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-pink-50 file:to-rose-50 file:text-pink-700 hover:file:from-pink-100 hover:file:to-rose-100 bg-slate-50/50"
                              />
                              {playlistFilesToUpload && playlistFilesToUpload.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-sm text-slate-600 font-medium">Files to upload:</p>
                                  {playlistFilesToUpload.map((file, index) => (
                                    <div key={index} className="text-sm text-slate-600 bg-pink-50 p-3 rounded-xl border border-pink-200 flex items-center justify-between">
                                      <span>
                                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newFiles = playlistFilesToUpload.filter((_, i) => i !== index);
                                          setPlaylistFilesToUpload(newFiles);
                                        }}
                                        className="text-red-500 hover:text-red-700 ml-2"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                              Upload new files to add to this playlist (Max size: 50MB per file, Max 5 files)
                            </p>
                          </div>

                          {/* Select Existing Files Section */}
                          <div>
                            <h4 className="text-lg font-semibold text-slate-900 mb-4">
                              Or Select Existing Files
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                              {availableFiles.map((file) => (
                                <div
                                  key={file.id}
                                  className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                                    selectedFilesForPlaylist.includes(file.id)
                                      ? "border-pink-500 bg-pink-50"
                                      : "border-slate-200 hover:border-pink-300 hover:bg-pink-25"
                                  }`}
                                  onClick={() => {
                                    setSelectedFilesForPlaylist((prev) =>
                                      prev.includes(file.id)
                                        ? prev.filter((id) => id !== file.id)
                                        : [...prev, file.id]
                                    );
                                  }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl flex items-center justify-center">
                                      {file.name
                                        ?.toLowerCase()
                                        .endsWith(".pdf") && (
                                        <svg
                                          className="w-5 h-5 text-red-600"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                          />
                                        </svg>
                                      )}
                                      {file.name
                                        ?.toLowerCase()
                                        .match(/\.(doc|docx)$/) && (
                                        <svg
                                          className="w-5 h-5 text-blue-600"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                          />
                                        </svg>
                                      )}
                                      {file.name
                                        ?.toLowerCase()
                                        .match(/\.(jpg|jpeg|png|gif)$/) && (
                                        <svg
                                          className="w-5 h-5 text-green-600"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                          />
                                        </svg>
                                      )}
                                      {!file.name?.match(
                                        /\.(pdf|doc|docx|jpg|jpeg|png|gif|zip)$/
                                      ) && (
                                        <svg
                                          className="w-5 h-5 text-slate-600"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-slate-900 truncate">
                                        {file.name}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {new Date(file.created_at).toLocaleDateString("ar-SA")}
                                      </p>
                                    </div>
                                    {selectedFilesForPlaylist.includes(file.id) && (
                                      <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                                        <svg
                                          className="w-4 h-4 text-white"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end space-x-4">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddFilesToPlaylist(false);
                                setSelectedPlaylist(null);
                                setSelectedFilesForPlaylist([]);
                                setPlaylistFilesToUpload([]);
                              }}
                              className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all duration-300"
                              disabled={addingFilesToPlaylist}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={addFilesToPlaylist}
                              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold rounded-2xl hover:from-pink-700 hover:to-rose-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                              disabled={
                                addingFilesToPlaylist ||
                                (selectedFilesForPlaylist.length === 0 && playlistFilesToUpload.length === 0)
                              }
                            >
                              {addingFilesToPlaylist && (
                                <svg
                                  className="w-5 h-5 animate-spin"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                              )}
                              <span>
                                {addingFilesToPlaylist
                                  ? "Adding..."
                                  : `Add ${selectedFilesForPlaylist.length + playlistFilesToUpload.length} File${
                                      selectedFilesForPlaylist.length + playlistFilesToUpload.length !== 1
                                        ? "s"
                                        : ""
                                    }`}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/60 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                              {playlist.title}
                            </h3>

                            {/* Playlist actions for Professors */}
                            {(classData?.owner_id === user?.id || profile?.role === "professor") && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedPlaylist(playlist);
                                    fetchAvailableFiles();
                                    setShowAddFilesToPlaylist(true);
                                  }}
                                  className="inline-flex items-center px-4 py-2 bg-pink-100 text-pink-700 font-semibold rounded-xl hover:bg-pink-200 transition-all duration-300 shadow-md hover:shadow-lg"
                                  title="Upload new files or select existing ones to add to this playlist"
                                >
                                  <svg
                                    className="w-4 h-4 ml-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                  </svg>
                                  Add Files
                                </button>
                                <button
                                  onClick={() => deletePlaylist(playlist.id)}
                                  className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 transition-all duration-300 shadow-md hover:shadow-lg"
                                  title="Delete Playlist"
                                >
                                  <svg
                                    className="w-4 h-4 ml-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>

                          {playlist.description && (
                            <p className="text-slate-600 mb-4 leading-relaxed text-lg">
                              {playlist.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-6 text-sm text-slate-500 mb-4">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="w-5 h-5 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="font-medium">
                                Created:{" "}
                                {new Date(playlist.created_at).toLocaleString(
                                  "ar-SA"
                                )}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg
                                className="w-5 h-5 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                              </svg>
                              <span className="font-medium">
                                {playlist.files?.length || 0} file
                                {(playlist.files?.length || 0) !== 1 ? "s" : ""}
                              </span>
                            </div>
                            {playlist.is_public && (
                              <div className="flex items-center space-x-2">
                                <svg
                                  className="w-5 h-5 text-green-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span className="font-medium text-green-600">
                                  Public
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Playlist files */}
                      {playlist.files && playlist.files.length > 0 ? (
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-slate-900 mb-4">
                            Files in Playlist
                          </h4>
                          {playlist.files
                            .sort((a, b) => a.position - b.position)
                            .map((playlistFile) => (
                              <div
                                key={playlistFile.id}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-pink-50 rounded-2xl border border-slate-200"
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center">
                                    {playlistFile.files?.name
                                      ?.toLowerCase()
                                      .endsWith(".pdf") && (
                                      <svg
                                        className="w-6 h-6 text-red-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                    )}
                                    {playlistFile.files?.name
                                      ?.toLowerCase()
                                      .match(/\.(doc|docx)$/) && (
                                      <svg
                                        className="w-6 h-6 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                    )}
                                    {playlistFile.files?.name
                                      ?.toLowerCase()
                                      .match(/\.(jpg|jpeg|png|gif)$/) && (
                                      <svg
                                        className="w-6 h-6 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                    )}
                                    {!playlistFile.files?.name?.match(
                                      /\.(pdf|doc|docx|jpg|jpeg|png|gif|zip)$/
                                    ) && (
                                      <svg
                                        className="w-6 h-6 text-slate-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900">
                                      {playlistFile.files?.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Added{" "}
                                      {new Date(
                                        playlistFile.created_at
                                      ).toLocaleDateString("ar-SA")}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={playlistFile.files?.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-semibold rounded-xl hover:from-pink-700 hover:to-rose-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                >
                                  <svg
                                    className="w-4 h-4 ml-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  Download
                                </a>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <svg
                            className="w-12 h-12 text-slate-400 mx-auto mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                          <p className="text-slate-500 text-lg font-medium">
                            No files in this playlist yet
                          </p>
                          {(classData?.owner_id === user?.id || profile?.role === "professor") && (
                            <button
                              onClick={() => {
                                setSelectedPlaylist(playlist);
                                fetchAvailableFiles();
                                setShowAddFilesToPlaylist(true);
                              }}
                              className="mt-4 inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold rounded-2xl hover:from-pink-700 hover:to-rose-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                              title="Upload new files or select existing ones to add to this playlist"
                            >
                              <svg
                                className="w-5 h-5 ml-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                              Add First File
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {playlists.length === 0 && (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-pink-100 to-rose-100 rounded-3xl mb-6">
                        <svg
                          className="w-12 h-12 text-pink-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">
                        No Playlists Yet
                      </h3>
                      {(classData?.owner_id === user?.id || profile?.role === "professor") ? (
                        <>
                          <p className="text-slate-600 mb-8 text-lg">
                            Create your first playlist to organize class files
                          </p>
                          <button
                            onClick={() => setShowPlaylistForm(true)}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold rounded-3xl hover:from-pink-700 hover:to-rose-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                          >
                            <svg
                              className="w-6 h-6 ml-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            <span>Create First Playlist</span>
                          </button>
                        </>
                      ) : (
                        <p className="text-slate-600 text-lg">
                          Playlists will be created by the professor soon
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === "questions" && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowQuestionForm(true)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                  >
                    <svg
                      className="w-5 h-5 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Ask Question
                  </button>
                </div>

                {showQuestionForm && (
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Ask a Question
                      </h3>
                      <button
                        onClick={() => setShowQuestionForm(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={submitQuestion} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Your Question
                        </label>
                        <textarea
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 resize-none bg-slate-50/50"
                          rows={4}
                          placeholder="Type your question here..."
                          required
                        />
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowQuestionForm(false);
                            setNewQuestion("");
                          }}
                          className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all duration-300"
                          disabled={submittingQuestion}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          disabled={submittingQuestion}
                        >
                          {submittingQuestion && (
                            <svg
                              className="w-5 h-5 animate-spin"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                            </svg>
                          )}
                          <span>
                            {submittingQuestion ? "Submitting..." : "Submit Question"}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Answer Form */}
                {answeringQuestion && (
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Answer Question
                      </h3>
                      <button
                        onClick={() => {
                          setAnsweringQuestion(null);
                          setAnswerContent("");
                        }}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={submitAnswer} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Your Answer
                        </label>
                        <textarea
                          value={answerContent}
                          onChange={(e) => setAnswerContent(e.target.value)}
                          className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 resize-none bg-slate-50/50"
                          rows={4}
                          placeholder="Type your answer here..."
                          required
                        />
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setAnsweringQuestion(null);
                            setAnswerContent("");
                          }}
                          className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all duration-300"
                          disabled={submittingAnswer}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          disabled={submittingAnswer}
                        >
                          {submittingAnswer && (
                            <svg
                              className="w-5 h-5 animate-spin"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          )}
                          <span>
                            {submittingAnswer ? "Submitting..." : "Submit Answer"}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-6">
                  {questions.map((question) => (
                    <div
                      key={question.id}
                      className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/60 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Question */}
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            {question.author_avatar ? (
                              <img
                                src={question.author_avatar}
                                alt={question.author_name}
                                className="w-12 h-12 rounded-2xl object-cover shadow-lg border-2 border-white"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">
                                  {question.author_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-slate-900 text-lg">
                                {question.author_name}
                              </h4>
                              <p className="text-sm text-slate-500 font-medium">
                                {new Date(question.created_at).toLocaleString(
                                  "ar-SA"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Question
                          </div>
                        </div>
                        <div className="prose prose-slate max-w-none">
                          <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                            {question.content}
                          </p>
                        </div>
                      </div>

                      {/* Answer */}
                      {question.answer ? (
                        <div className="border-t border-slate-200 pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              {question.answer.author_avatar ? (
                                <img
                                  src={question.answer.author_avatar}
                                  alt={question.answer.author_name}
                                  className="w-12 h-12 rounded-2xl object-cover shadow-lg border-2 border-white"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                                  <span className="text-white font-bold text-lg">
                                    {question.answer.author_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-slate-900 text-lg">
                                  {question.answer.author_name}
                                </h4>
                                <p className="text-sm text-slate-500 font-medium">
                                  {new Date(question.answer.created_at).toLocaleString(
                                    "ar-SA"
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                              Answer
                            </div>
                          </div>
                          <div className="prose prose-slate max-w-none">
                            <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                              {question.answer.content}
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Answer Button for Professors */
                        (classData?.owner_id === user?.id || profile?.role === "professor") && (
                          <div className="border-t border-slate-200 pt-6">
                            <div className="flex justify-center">
                              <button
                                onClick={() => setAnsweringQuestion(question.id)}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                              >
                                <svg
                                  className="w-5 h-5 ml-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                  />
                                </svg>
                                Answer Question
                              </button>
                            </div>
                          </div>
                        )
                      )}

                      {/* Delete Button for Admin/Professor */}
                      {(classData?.owner_id === user?.id || profile?.role === "admin") && (
                        <div className="border-t border-slate-200 pt-6">
                          <div className="flex justify-center">
                            <button
                              onClick={() => deleteQuestion(question.id)}
                              disabled={deletingQuestion === question.id}
                              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-2xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingQuestion === question.id ? (
                                <svg
                                  className="w-5 h-5 ml-2 animate-spin"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-5 h-5 ml-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              )}
                              <span>
                                {deletingQuestion === question.id ? "Deleting..." : "Delete Question"}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {questions.length === 0 && (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-orange-100 to-red-100 rounded-3xl mb-6">
                        <svg
                          className="w-12 h-12 text-orange-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">
                        No Questions Yet
                      </h3>
                      <p className="text-slate-600 mb-8 text-lg">
                        Be the first to ask a question or wait for students to ask
                      </p>
                      <button
                        onClick={() => setShowQuestionForm(true)}
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-3xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                      >
                        <svg
                          className="w-6 h-6 ml-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Ask First Question</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === "members" &&
              (classData.owner_id === user?.id ||
                profile?.role === "admin") && (
                <div className="space-y-6">
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/60 p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Manage Students in Class
                      </h3>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => fetchClassData()}
                          className="inline-flex items-center px-4 py-3 bg-blue-100 text-blue-700 font-semibold rounded-2xl hover:bg-blue-200 transition-all duration-300 shadow-md hover:shadow-lg"
                          title="Refresh Data"
                        >
                          <svg
                            className="w-5 h-5 ml-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Update
                        </button>
                        {(classData.owner_id === user?.id ||
                          profile?.role === "admin") && (
                          <button
                            onClick={() => setShowAddProfessorForm(true)}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                          >
                            <svg
                              className="w-5 h-5 ml-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            Add Professor
                          </button>
                        )}
                      </div>
                    </div>

                    {members.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl mb-6">
                          <svg
                            className="w-12 h-12 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                            />
                          </svg>
                        </div>
                        <h4 className="text-2xl font-bold text-slate-900 mb-3">
                          No Students in Class
                        </h4>
                        <p className="text-slate-600 text-lg">
                          No students have joined the class yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                          >
                            <div className="flex items-center space-x-4">
                              {member.profiles?.avatar_url ? (
                                <img
                                  src={member.profiles.avatar_url}
                                  alt={member.profiles?.full_name || "User"}
                                  className="w-14 h-14 rounded-3xl object-cover shadow-lg border-2 border-white"
                                />
                              ) : (
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg">
                                  <span className="text-white font-bold text-xl">
                                    {member.profiles?.full_name
                                      ?.charAt(0)
                                      .toUpperCase() || "?"}
                                  </span>
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-slate-900 text-lg">
                                  {member.profiles?.full_name &&
                                  member.profiles.full_name.trim() !== ""
                                    ? member.profiles.full_name
                                    : "Anonymous User"}
                                </h4>
                                <p className="text-sm text-slate-600 font-medium">
                                  {member.profiles?.email || ""}
                                </p>
                                <div className="flex items-center space-x-3 mt-2">
                                  {/* Role display removed as requested */}
                                  <span className="text-xs text-slate-500 font-medium">
                                    Joined on{" "}
                                    {new Date(
                                      member.joined_at
                                    ).toLocaleDateString("ar-SA")}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action buttons for admin/class owner */}
                            {member.user_id !== user?.id && (
                              <div className="flex items-center space-x-2">
                                {/* Promote/Demote button */}
                                {(classData?.owner_id === user?.id || profile?.role === "admin") && 
                                 member.profiles?.role !== "admin" && // Can't change admin role
                                 !(member.profiles?.role === "professor" && member.user_id === classData?.owner_id) && // Can't demote class owner
                                 member.id !== `owner-${member.user_id}` // Can't modify owner entries
                                && (
                                  <button
                                    onClick={() =>
                                      changeMemberRole(
                                        member.id,
                                        member.profiles?.full_name &&
                                          member.profiles.full_name.trim() !== ""
                                          ? member.profiles.full_name
                                          : "Anonymous User",
                                        member.profiles?.role === "professor" ? "student" : "professor",
                                        member.user_id
                                      )
                                    }
                                    disabled={removingMember === member.id}
                                    className={`inline-flex items-center px-4 py-2 font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                                      member.profiles?.role === "professor"
                                        ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                        : "bg-green-100 text-green-700 hover:bg-green-200"
                                    }`}
                                    title={member.profiles?.role === "professor" ? "Demote to Student" : "Promote to Professor"}
                                  >
                                    {removingMember === member.id ? (
                                      <svg
                                        className="w-4 h-4 animate-spin ml-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                      </svg>
                                    ) : (
                                      <svg
                                        className="w-4 h-4 ml-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d={member.profiles?.role === "professor"
                                            ? "M19 14l-7 7m0 0l-7-7m7 7V3"
                                            : "M5 10l7-7m0 0l7 7m-7-7v18"
                                          }
                                        />
                                      </svg>
                                    )}
                                    <span className="text-sm">
                                      {removingMember === member.id
                                        ? "Updating..."
                                        : member.profiles?.role === "professor"
                                        ? "Demote"
                                        : "Promote"}
                                    </span>
                                  </button>
                                )}

                                {/* Remove button */}
                                {(classData?.owner_id === user?.id || profile?.role === "admin") && 
                                 member.profiles?.role !== "admin" && // Can't remove admin
                                 member.user_id !== classData?.owner_id && // Can't remove class owner
                                 member.id !== `owner-${member.user_id}` // Can't remove owner entries
                                && (
                                  <button
                                    onClick={() =>
                                      removeMember(
                                        member.id,
                                        member.profiles?.full_name &&
                                          member.profiles.full_name.trim() !== ""
                                          ? member.profiles.full_name
                                          : "Anonymous User"
                                      )
                                    }
                                    disabled={removingMember === member.id}
                                    className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Remove from Class"
                                  >
                                    {removingMember === member.id ? (
                                      <svg
                                        className="w-4 h-4 animate-spin ml-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                      </svg>
                                    ) : (
                                      <svg
                                        className="w-4 h-4 ml-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    )}
                                    <span className="text-sm">
                                      {removingMember === member.id
                                        ? "Removing..."
                                        : "Remove"}
                                    </span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Add Professor Modal */}
        {showAddProfessorForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Add Professor to Class
                </h3>
                <button
                  onClick={() => setShowAddProfessorForm(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={addProfessor} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Professor&apos;s Email
                  </label>
                  <input
                    type="email"
                    value={professorEmail}
                    onChange={(e) => setProfessorEmail(e.target.value)}
                    className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-slate-50/50"
                    placeholder="professor@example.com"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Enter the email of the professor you want to add
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddProfessorForm(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    disabled={addingProfessor}
                  >
                    {addingProfessor && (
                      <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    )}
                    <span>{addingProfessor ? "Adding..." : "Add Professor"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Settings Modal for Assigning Main Professor */}
        {showSettingsForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Assign Main Professor
                </h3>
                <button
                  onClick={() => {
                    setShowSettingsForm(false);
                    setSearchProfessorEmail("");
                    setSearchedProfessors([]);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Search Professor by Email
                  </label>
                  <input
                    type="email"
                    value={searchProfessorEmail}
                    onChange={(e) => {
                      setSearchProfessorEmail(e.target.value);
                      searchProfessors(e.target.value);
                    }}
                    className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-slate-50/50"
                    placeholder="professor@example.com"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Type to search for professors by email
                  </p>
                </div>

                {/* Search Results */}
                {searchedProfessors.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">Search Results:</h4>
                    {searchedProfessors.map((Professor) => (
                      <div
                        key={Professor.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200"
                      >
                        <div className="flex items-center space-x-3">
                          {Professor.avatar_url ? (
                            <img
                              src={Professor.avatar_url}
                              alt={Professor.full_name || "Professor"}
                              className="w-10 h-10 rounded-2xl object-cover shadow-lg border-2 border-white"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold text-sm">
                                {(Professor.full_name || "P").charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <h5 className="font-bold text-slate-900 text-sm">
                              {Professor.full_name || "Professor"}
                            </h5>
                            <p className="text-xs text-slate-600">
                              {Professor.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => assignProfessorAsOwner(Professor.id, Professor.full_name || "Professor")}
                          disabled={assigningProfessor}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {assigningProfessor && (
                            <svg
                              className="w-4 h-4 animate-spin"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          )}
                          <span>{assigningProfessor ? "Assigning..." : "Assign as Main Professor"}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {searchingProfessors && (
                  <div className="text-center py-4">
                    <svg
                      className="w-6 h-6 animate-spin mx-auto text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <p className="text-sm text-slate-600 mt-2">Searching...</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsForm(false);
                      setSearchProfessorEmail("");
                      setSearchedProfessors([]);
                    }}
                    className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all duration-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Back Button */}
        <div className="fixed bottom-6 left-6 z-50">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-800 text-white font-bold rounded-3xl hover:from-slate-700 hover:to-slate-900 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-110"
            title="Back to Home Page"
          >
            <svg
              className="w-6 h-6 ml-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Home</span>
          </button>
        </div>
      </div>
      )
    </div>
  );
}
