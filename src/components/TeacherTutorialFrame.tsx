"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiChevronRight,
  FiFolder,
  FiSend,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";

interface TeacherTutorialFrameProps {
  userId: string;
  children: React.ReactNode;
}

interface TutorialStep {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Request a subject",
    description:
      "Go to My Requests and click New Request. Fill subject name, course code, and department, then submit.",
    href: "/teacher/requests",
    icon: <FiSend />,
  },
  {
    title: "After request submission",
    description:
      "Your request shows as pending until admin review. Once approved, you can access the subject in Upload.",
    href: "/teacher/requests",
    icon: <FiCheckCircle />,
  },
  {
    title: "Create subject folder",
    description:
      "Folder creation is automatic. When your request is approved, select that course in Upload and upload your first file.",
    href: "/teacher/upload",
    icon: <FiFolder />,
  },
  {
    title: "Upload materials",
    description:
      "Open Upload, choose an approved subject, optionally set section name, and add files in the upload box.",
    href: "/teacher/upload",
    icon: <FiUploadCloud />,
  },
  {
    title: "Delete a file",
    description:
      "In Upload, use the delete action on a file card. You can delete your own files or any file in a subject you own.",
    href: "/teacher/upload",
    icon: <FiTrash2 />,
  },
  {
    title: "Delete entire subject folder",
    description:
      "In Upload, select your owned subject and use Delete Subject Folder. Confirm with your password to remove all files.",
    href: "/teacher/upload",
    icon: <FiTrash2 />,
  },
];

function StepByStepGuidedView({
  currentStep,
  onNext,
  onPrev,
  onClose,
}: {
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const step = TUTORIAL_STEPS[currentStep];
  if (!step) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Progress: {((currentStep + 1) / TUTORIAL_STEPS.length * 100).toFixed(0)}%
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
            aria-label="Close tutorial"
          >
            <FiX />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xl">
              {step.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
            </div>
          </div>

          <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Next Step</p>
            <p className="mt-2 text-sm text-indigo-900">
              Click &quot;Next&quot; to go to the <strong>{step.title.toLowerCase()}</strong> page.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-slate-50 px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={onPrev}
            disabled={currentStep === 0}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {currentStep === TUTORIAL_STEPS.length - 1 ? "Done" : "Next"}
            {currentStep !== TUTORIAL_STEPS.length - 1 && <FiChevronRight />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherTutorialFrame({ userId, children }: TeacherTutorialFrameProps) {
  const router = useRouter();
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const storageKey = useMemo(
    () => `coursedrop.teacher.tutorial.seen.${userId}`,
    [userId]
  );

  useEffect(() => {
    const hasSeen = window.localStorage.getItem(storageKey);
    if (hasSeen) {
      return;
    }

    window.localStorage.setItem(storageKey, "1");
    const timerId = window.setTimeout(() => {
      setIsTutorialOpen(true);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [storageKey]);

  useEffect(() => {
    const openFromSidebar = () => {
      setCurrentStep(0);
      setIsTutorialOpen(true);
      router.push(TUTORIAL_STEPS[0].href);
    };

    window.addEventListener("coursedrop:open-teacher-tutorial", openFromSidebar);
    return () => {
      window.removeEventListener("coursedrop:open-teacher-tutorial", openFromSidebar);
    };
  }, [router]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Navigate to the next step's page
      router.push(TUTORIAL_STEPS[nextStep].href);
    } else {
      // Tutorial finished
      setIsTutorialOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      // Navigate to the previous step's page
      router.push(TUTORIAL_STEPS[prevStep].href);
    }
  };

  const handleClose = () => {
    setIsTutorialOpen(false);
  };

  return (
    <>
      <div className="flex flex-1 overflow-hidden bg-slate-50">
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>

      {isTutorialOpen && (
        <StepByStepGuidedView
          currentStep={currentStep}
          onNext={handleNext}
          onPrev={handlePrev}
          onClose={handleClose}
        />
      )}
    </>
  );
}