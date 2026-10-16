using UnityEngine;
using System.Collections.Generic;

public class LevelScreenManager : MonoBehaviour
{
    public static LevelScreenManager Instance { get; private set; }

    [Header("UI Panels")]
    [SerializeField] private GameObject worldScreenPanel;
    [SerializeField] private GameObject levelScreenPanel;

    [Header("Static Level Scripts")]
    [Tooltip("Drag the LevelButtonAction scripts from the unlocked buttons here")]
    [SerializeField] private LevelButtonAction[] staticLevelButtons;

    [Header("Lock/Unlock Visuals")]
    [Tooltip("Drag the unlocked level GameObjects here in level order")]
    [SerializeField] private GameObject[] unlockedVisuals;

    [Tooltip("Drag the locked level GameObjects here in level order")]
    [SerializeField] private GameObject[] lockedVisuals;

    private string _currentWorldId;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void OpenLevelsForWorld(string worldId)
    {
        if (GameDataManager.Instance == null)
        {
            Debug.LogError("Cannot open levels because GameDataManager.Instance is missing.");
            return;
        }

        _currentWorldId = worldId;

        if (worldScreenPanel != null) worldScreenPanel.SetActive(false);
        if (levelScreenPanel != null) levelScreenPanel.SetActive(true);

        var levels = GameDataManager.Instance.GetSortedLevels(worldId);

        if (levels == null)
        {
            Debug.LogWarning($"No levels were found for world '{worldId}'.");
            return;
        }

        SynchronizeCompletedLevelUnlocks(worldId, levels);

        for (int i = 0; i < staticLevelButtons.Length; i++)
        {
            bool hasLevelData = levels != null && i < levels.Count;

            if (!hasLevelData)
            {
                SetLevelVisualState(i, false, false);
                continue;
            }

            string levelId = levels[i].Key;
            bool isUnlocked = i == 0 || IsLevelUnlocked(worldId, levelId);

            SetLevelVisualState(i, isUnlocked, true);

            if (isUnlocked && staticLevelButtons[i] != null)
            {
                staticLevelButtons[i].Setup(
                    worldId,
                    levelId,
                    levels[i].Value.Title
                );
            }
        }
    }

    private void SetLevelVisualState(int index, bool isUnlocked, bool hasLevelData)
    {
        if (unlockedVisuals != null &&
            index < unlockedVisuals.Length &&
            unlockedVisuals[index] != null)
        {
            unlockedVisuals[index].SetActive(hasLevelData && isUnlocked);
        }

        if (lockedVisuals != null &&
            index < lockedVisuals.Length &&
            lockedVisuals[index] != null)
        {
            lockedVisuals[index].SetActive(hasLevelData && !isUnlocked);
        }
    }

    public void BackToWorldsScreen()
    {
        if (levelScreenPanel != null) levelScreenPanel.SetActive(false);
        if (worldScreenPanel != null) worldScreenPanel.SetActive(true);
    }

    public bool IsLevelUnlocked(string worldId, string levelId)
    {
        return PlayerPrefs.GetInt(GetLevelUnlockKey(worldId, levelId), 0) == 1;
    }

    public void UnlockLevel(string worldId, string levelId)
    {
        if (string.IsNullOrWhiteSpace(worldId) || string.IsNullOrWhiteSpace(levelId))
        {
            Debug.LogWarning("Cannot unlock a level because its world ID or level ID is empty.");
            return;
        }

        PlayerPrefs.SetInt(GetLevelUnlockKey(worldId, levelId), 1);
        PlayerPrefs.Save();

        Debug.Log($"Unlocked level '{levelId}' in world '{worldId}'.");
    }

    /// <summary>
    /// Unlocks every level and every lesson in the world currently displayed.
    /// Assign this parameterless method directly to a Unity Button On Click event.
    /// </summary>
    public void UnlockAll()
    {
        if (string.IsNullOrWhiteSpace(_currentWorldId))
        {
            Debug.LogWarning(
                "Cannot unlock all because a world has not been opened yet."
            );
            return;
        }

        UnlockAllForWorld(_currentWorldId);
    }

    public void UnlockAllForWorld(string worldId)
    {
        if (GameDataManager.Instance == null)
        {
            Debug.LogError("Cannot unlock all because GameDataManager.Instance is missing.");
            return;
        }

        if (string.IsNullOrWhiteSpace(worldId))
        {
            Debug.LogWarning("Cannot unlock all because the world ID is empty.");
            return;
        }

        var levels = GameDataManager.Instance.GetSortedLevels(worldId);

        if (levels == null || levels.Count == 0)
        {
            Debug.LogWarning($"No levels were found for world '{worldId}'.");
            return;
        }

        foreach (KeyValuePair<string, LevelData> levelEntry in levels)
        {
            string levelId = levelEntry.Key;
            LevelData level = levelEntry.Value;
            int lessonCount = level != null && level.Lessons != null
                ? level.Lessons.Count
                : 0;

            PlayerPrefs.SetInt(GetLevelUnlockKey(worldId, levelId), 1);
            PlayerPrefs.SetInt(
                $"HighestUnlockedLesson_{worldId}_{levelId}",
                lessonCount
            );
        }

        PlayerPrefs.Save();
        Debug.Log($"Unlocked every level and lesson in world '{worldId}'.");

        OpenLevelsForWorld(worldId);
    }

    /// <summary>
    /// Checks the real Firebase lesson count for the completed level and unlocks
    /// the next level only when every lesson has been completed or skipped.
    /// </summary>
    public void TryUnlockNextLevel(string worldId, string completedLevelId)
    {
        if (GameDataManager.Instance == null)
        {
            Debug.LogError("Cannot unlock the next level because GameDataManager.Instance is missing.");
            return;
        }

        var levels = GameDataManager.Instance.GetSortedLevels(worldId);

        if (levels == null || levels.Count == 0)
            return;

        int completedLevelIndex = FindLevelIndex(levels, completedLevelId);

        if (completedLevelIndex < 0)
        {
            Debug.LogWarning(
                $"Cannot find completed level '{completedLevelId}' in world '{worldId}'."
            );
            return;
        }

        LevelData completedLevel = levels[completedLevelIndex].Value;
        int lessonCount = completedLevel != null && completedLevel.Lessons != null
            ? completedLevel.Lessons.Count
            : 0;

        string lessonProgressKey =
            $"HighestUnlockedLesson_{worldId}_{completedLevelId}";
        int completedLessonCount = PlayerPrefs.GetInt(lessonProgressKey, 0);

        if (lessonCount == 0 || completedLessonCount < lessonCount)
            return;

        UnlockNextLevel(worldId, completedLevelId);
    }

    /// <summary>
    /// Immediately unlocks the level after completedLevelId. This is also used
    /// by the Skip Level button.
    /// </summary>
    public void UnlockNextLevel(string worldId, string completedLevelId)
    {
        if (GameDataManager.Instance == null)
        {
            Debug.LogError("Cannot unlock the next level because GameDataManager.Instance is missing.");
            return;
        }

        var levels = GameDataManager.Instance.GetSortedLevels(worldId);

        if (levels == null || levels.Count == 0)
            return;

        int completedLevelIndex = FindLevelIndex(levels, completedLevelId);

        if (completedLevelIndex < 0)
        {
            Debug.LogWarning(
                $"Cannot find completed level '{completedLevelId}' in world '{worldId}'."
            );
            return;
        }

        int nextLevelIndex = completedLevelIndex + 1;

        if (nextLevelIndex >= levels.Count)
        {
            Debug.Log($"'{completedLevelId}' is already the last level in '{worldId}'.");
            return;
        }

        UnlockLevel(worldId, levels[nextLevelIndex].Key);
    }

    private void SynchronizeCompletedLevelUnlocks(
        string worldId,
        IList<KeyValuePair<string, LevelData>> levels
    )
    {
        bool changed = false;

        for (int i = 0; i < levels.Count - 1; i++)
        {
            LevelData level = levels[i].Value;
            int lessonCount = level != null && level.Lessons != null
                ? level.Lessons.Count
                : 0;

            if (lessonCount == 0)
                continue;

            string progressKey = $"HighestUnlockedLesson_{worldId}_{levels[i].Key}";
            int completedLessonCount = PlayerPrefs.GetInt(progressKey, 0);

            if (completedLessonCount < lessonCount)
                continue;

            string nextLevelUnlockKey = GetLevelUnlockKey(
                worldId,
                levels[i + 1].Key
            );

            if (PlayerPrefs.GetInt(nextLevelUnlockKey, 0) == 1)
                continue;

            PlayerPrefs.SetInt(nextLevelUnlockKey, 1);
            changed = true;

            Debug.Log(
                $"Restored next-level unlock for '{levels[i + 1].Key}' " +
                $"after detecting all lessons complete in '{levels[i].Key}'."
            );
        }

        if (changed)
            PlayerPrefs.Save();
    }

    private static int FindLevelIndex(
        IList<KeyValuePair<string, LevelData>> levels,
        string levelId
    )
    {
        for (int i = 0; i < levels.Count; i++)
        {
            if (levels[i].Key == levelId)
                return i;
        }

        return -1;
    }

    private static string GetLevelUnlockKey(string worldId, string levelId)
    {
        return $"{worldId}_{levelId}_unlocked";
    }
}
