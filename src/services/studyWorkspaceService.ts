import { prisma } from '@/lib/prisma'

/**
 * Study Workspace Service
 * Handles shared workspace operations for study buddy matches
 */

// Get or create workspace for a match
export async function getOrCreateWorkspace(matchId: string, userId: string) {
  // Verify the user is part of the match
  const match = await prisma.studyBuddyMatch.findFirst({
    where: {
      id: matchId,
      OR: [
        { user1Id: userId },
        { user2Id: userId }
      ]
    }
  })

  if (!match) {
    throw new Error('Match not found or unauthorized')
  }

  // Get or create workspace
  let workspace = await prisma.studyWorkspace.findUnique({
    where: { matchId },
    include: {
      resources: {
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              arabicName: true,
              profileImage: true
            }
          }
        }
      },
      notes: {
        orderBy: { updatedAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              arabicName: true,
              profileImage: true
            }
          }
        }
      },
      goals: {
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              arabicName: true,
              profileImage: true
            }
          }
        }
      },
      coWatchSessions: {
        where: { status: 'ACTIVE' },
        orderBy: { startedAt: 'desc' },
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              arabicName: true,
              profileImage: true
            }
          }
        }
      }
    }
  })

  if (!workspace) {
    // Create workspace with default name
    const otherUser = match.user1Id === userId 
      ? await prisma.user.findUnique({ where: { id: match.user2Id }, select: { name: true } })
      : await prisma.user.findUnique({ where: { id: match.user1Id }, select: { name: true } })

    workspace = await prisma.studyWorkspace.create({
      data: {
        matchId,
        name: `Study Workspace with ${otherUser?.name || 'Study Buddy'}`,
        description: 'Collaborative learning space',
        isActive: true
      },
      include: {
        resources: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                arabicName: true,
                profileImage: true
              }
            }
          }
        },
        notes: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                arabicName: true,
                profileImage: true
              }
            }
          }
        },
        goals: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                arabicName: true,
                profileImage: true
              }
            }
          }
        },
        coWatchSessions: {
          include: {
            initiator: {
              select: {
                id: true,
                name: true,
                arabicName: true,
                profileImage: true
              }
            }
          }
        }
      }
    })
  }

  return workspace
}

// Upload resource to workspace
export async function uploadResource(
  workspaceId: string,
  userId: string,
  data: {
    title: string
    description?: string
    type: string
    url: string
    fileSize?: number
    mimeType?: string
    tags?: string[]
  }
) {
  // Verify user has access to workspace
  const workspace = await prisma.studyWorkspace.findUnique({
    where: { id: workspaceId },
    include: {
      match: true
    }
  })

  if (!workspace) {
    throw new Error('Workspace not found')
  }

  if (workspace.match.user1Id !== userId && workspace.match.user2Id !== userId) {
    throw new Error('Unauthorized')
  }

  const resource = await prisma.workspaceResource.create({
    data: {
      workspaceId,
      uploadedBy: userId,
      title: data.title,
      description: data.description,
      type: data.type as any,
      url: data.url,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      tags: data.tags ? JSON.stringify(data.tags) : null
    },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          arabicName: true,
          profileImage: true
        }
      }
    }
  })

  // Update workspace activity
  await prisma.studyWorkspace.update({
    where: { id: workspaceId },
    data: { lastActivityAt: new Date() }
  })

  return resource
}

// Create or update note
export async function saveNote(
  workspaceId: string,
  userId: string,
  data: {
    id?: string
    title: string
    content: string
    color?: string
    isPinned?: boolean
    tags?: string[]
  }
) {
  // Verify access
  const workspace = await prisma.studyWorkspace.findUnique({
    where: { id: workspaceId },
    include: { match: true }
  })

  if (!workspace) {
    throw new Error('Workspace not found')
  }

  if (workspace.match.user1Id !== userId && workspace.match.user2Id !== userId) {
    throw new Error('Unauthorized')
  }

  let note

  if (data.id) {
    // Update existing note
    note = await prisma.workspaceNote.update({
      where: { id: data.id },
      data: {
        title: data.title,
        content: data.content,
        color: data.color,
        isPinned: data.isPinned,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        lastEditedBy: userId,
        lastEditedAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            profileImage: true
          }
        },
        lastEditor: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            profileImage: true
          }
        }
      }
    })
  } else {
    // Create new note
    note = await prisma.workspaceNote.create({
      data: {
        workspaceId,
        createdBy: userId,
        title: data.title,
        content: data.content,
        color: data.color || '#fbbf24',
        isPinned: data.isPinned || false,
        tags: data.tags ? JSON.stringify(data.tags) : null
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            profileImage: true
          }
        }
      }
    })
  }

  // Update workspace activity
  await prisma.studyWorkspace.update({
    where: { id: workspaceId },
    data: { lastActivityAt: new Date() }
  })

  return note
}

// Create or update goal
export async function saveGoal(
  workspaceId: string,
  userId: string,
  data: {
    id?: string
    title: string
    description?: string
    targetDate?: Date
    status?: string
    progress?: number
    category?: string
    priority?: string
    milestones?: any[]
  }
) {
  // Verify access
  const workspace = await prisma.studyWorkspace.findUnique({
    where: { id: workspaceId },
    include: { match: true }
  })

  if (!workspace) {
    throw new Error('Workspace not found')
  }

  if (workspace.match.user1Id !== userId && workspace.match.user2Id !== userId) {
    throw new Error('Unauthorized')
  }

  let goal

  if (data.id) {
    // Update existing goal
    goal = await prisma.workspaceGoal.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        targetDate: data.targetDate,
        status: data.status as any,
        progress: data.progress,
        category: data.category,
        priority: data.priority,
        milestones: data.milestones ? JSON.stringify(data.milestones) : null,
        completedAt: data.status === 'COMPLETED' ? new Date() : null
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            profileImage: true
          }
        }
      }
    })
  } else {
    // Create new goal
    goal = await prisma.workspaceGoal.create({
      data: {
        workspaceId,
        createdBy: userId,
        title: data.title,
        description: data.description,
        targetDate: data.targetDate,
        status: (data.status as any) || 'IN_PROGRESS',
        progress: data.progress || 0,
        category: data.category,
        priority: data.priority || 'medium',
        milestones: data.milestones ? JSON.stringify(data.milestones) : null
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            profileImage: true
          }
        }
      }
    })
  }

  // Update workspace activity
  await prisma.studyWorkspace.update({
    where: { id: workspaceId },
    data: { lastActivityAt: new Date() }
  })

  return goal
}

// Start co-watch session
export async function startCoWatchSession(
  workspaceId: string,
  userId: string,
  data: {
    videoUrl: string
    videoTitle: string
    videoThumbnail?: string
    duration?: number
  }
) {
  // Verify access
  const workspace = await prisma.studyWorkspace.findUnique({
    where: { id: workspaceId },
    include: { match: true }
  })

  if (!workspace) {
    throw new Error('Workspace not found')
  }

  if (workspace.match.user1Id !== userId && workspace.match.user2Id !== userId) {
    throw new Error('Unauthorized')
  }

  // End any active co-watch sessions first
  await prisma.coWatchSession.updateMany({
    where: {
      workspaceId,
      status: 'ACTIVE'
    },
    data: {
      status: 'ENDED',
      endedAt: new Date()
    }
  })

  // Create new co-watch session
  const session = await prisma.coWatchSession.create({
    data: {
      workspaceId,
      initiatedBy: userId,
      videoUrl: data.videoUrl,
      videoTitle: data.videoTitle,
      videoThumbnail: data.videoThumbnail,
      duration: data.duration,
      currentTime: 0,
      isPlaying: false,
      status: 'ACTIVE',
      participants: JSON.stringify([{ userId, joinedAt: new Date() }])
    },
    include: {
      initiator: {
        select: {
          id: true,
          name: true,
          arabicName: true,
          profileImage: true
        }
      }
    }
  })

  // Update workspace activity
  await prisma.studyWorkspace.update({
    where: { id: workspaceId },
    data: { lastActivityAt: new Date() }
  })

  return session
}

// Update co-watch playback state
export async function updateCoWatchState(
  sessionId: string,
  userId: string,
  data: {
    currentTime?: number
    isPlaying?: boolean
  }
) {
  const session = await prisma.coWatchSession.findUnique({
    where: { id: sessionId },
    include: {
      workspace: {
        include: { match: true }
      }
    }
  })

  if (!session) {
    throw new Error('Session not found')
  }

  if (session.workspace.match.user1Id !== userId && session.workspace.match.user2Id !== userId) {
    throw new Error('Unauthorized')
  }

  const updated = await prisma.coWatchSession.update({
    where: { id: sessionId },
    data: {
      currentTime: data.currentTime,
      isPlaying: data.isPlaying
    }
  })

  return updated
}

// Delete resource
export async function deleteResource(resourceId: string, userId: string) {
  const resource = await prisma.workspaceResource.findUnique({
    where: { id: resourceId },
    include: {
      workspace: {
        include: { match: true }
      }
    }
  })

  if (!resource) {
    throw new Error('Resource not found')
  }

  // Only uploader or workspace members can delete
  if (resource.uploadedBy !== userId &&
      resource.workspace.match.user1Id !== userId &&
      resource.workspace.match.user2Id !== userId) {
    throw new Error('Unauthorized')
  }

  await prisma.workspaceResource.delete({
    where: { id: resourceId }
  })

  return { success: true }
}

// Delete note
export async function deleteNote(noteId: string, userId: string) {
  const note = await prisma.workspaceNote.findUnique({
    where: { id: noteId },
    include: {
      workspace: {
        include: { match: true }
      }
    }
  })

  if (!note) {
    throw new Error('Note not found')
  }

  // Only creator or workspace members can delete
  if (note.createdBy !== userId &&
      note.workspace.match.user1Id !== userId &&
      note.workspace.match.user2Id !== userId) {
    throw new Error('Unauthorized')
  }

  await prisma.workspaceNote.delete({
    where: { id: noteId }
  })

  return { success: true }
}

// Delete goal
export async function deleteGoal(goalId: string, userId: string) {
  const goal = await prisma.workspaceGoal.findUnique({
    where: { id: goalId },
    include: {
      workspace: {
        include: { match: true }
      }
    }
  })

  if (!goal) {
    throw new Error('Goal not found')
  }

  // Only creator or workspace members can delete
  if (goal.createdBy !== userId &&
      goal.workspace.match.user1Id !== userId &&
      goal.workspace.match.user2Id !== userId) {
    throw new Error('Unauthorized')
  }

  await prisma.workspaceGoal.delete({
    where: { id: goalId }
  })

  return { success: true }
}
