using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using UnityEngine.EventSystems;
using UnityEngine.Networking;
#if UNITY_ANDROID || UNITY_IOS
using UnityEngine.Android;
#endif

public class LessonGameFlow : MonoBehaviour
{
    public static LessonGameFlow Instance { get; private set; }

    [Header("Main UI Panels")]
    [SerializeField] private GameObject lessonSelectionMenu;
    [SerializeField] private GameObject learningPanel;
    [SerializeField] private GameObject textMultipleChoicePanel;
    [SerializeField] private GameObject audioMultipleChoicePanel;
    [SerializeField] private GameObject audioTypingPanel;
    [SerializeField] private GameObject speechComparePanel;

    [Header("1. Learning Phase UI")]
    [SerializeField] private TextMeshProUGUI learningNameText;
    [SerializeField] private TextMeshProUGUI learningDescriptionText;
    [SerializeField] private RectTransform learningGridContent;
    [SerializeField] private GridLayoutGroup learningGridLayout;
    [SerializeField] private GameObject learningCellPrefab;
    [Tooltip("Name of the TextMeshPro child inside the learning-cell prefab")]
    [SerializeField] private string cellTextObjectName = "LetterText";
    [Tooltip("Name of the audio Button child inside the learning-cell prefab")]
    [SerializeField] private string cellAudioButtonObjectName = "Button";
    [SerializeField] private Button learningNextButton;

    [Header("World Button Images")]
    [Tooltip("Assign each world button's Image component in world order")]
    [SerializeField] private Image[] worldButtonImages;
    [Tooltip("Fallback sprites shown until the uploaded images finish downloading")]
    [SerializeField] private Sprite[] defaultWorldButtonSprites;
    [Tooltip("Firebase Realtime Database appState REST endpoint")]
    [SerializeField] private string firebaseAppStateUrl =
        "https://linguakids-admin-default-rtdb.firebaseio.com/appState.json";

    [Header("2. Text Multiple Choice UI")]
    [SerializeField] private TextMeshProUGUI tmcQuestionText;
    [SerializeField] private Button[] tmcOptionButtons;
    [SerializeField] private TextMeshProUGUI[] tmcOptionTexts;

    [Header("3. Audio Multiple Choice UI")]
    [SerializeField] private Button amcPlayAudioButton;
    [SerializeField] private Button[] amcOptionButtons;
    [SerializeField] private TextMeshProUGUI[] amcOptionTexts;

    [Header("4. Audio Typing UI")]
    [SerializeField] private Button atPlayAudioButton;
    [SerializeField] private TMP_InputField atInputField;
    [SerializeField] private Button atSubmitButton;

    [Header("5. Speech Compare UI")]
    [SerializeField] private TextMeshProUGUI scWordText;
    [SerializeField] private Button scRecordButton;
    [SerializeField] private Button scPlayUserButton;
    [SerializeField] private Button scSubmitButton;
    [Tooltip("The visual graphic that scales up and down with voice volume")]
    [SerializeField] private Image scMicLevelBar;

    [Header("6. Quiz Stats UI")]
    [SerializeField] private TextMeshProUGUI[] questionCounterTexts;
    [SerializeField] private TextMeshProUGUI[] correctAnswerTexts;
    [SerializeField] private TextMeshProUGUI[] wrongAnswerTexts;

    [Header("7. Remote Audio (Voiceovers)")]
    [Tooltip("The AudioSource used to play the downloaded lesson sounds")]
    [SerializeField] private AudioSource lessonAudioSource;

    [Header("8. Local SFX & Music")]
    [SerializeField] private AudioSource sfxSource;
    [SerializeField] private AudioSource bgmSource;
    [Tooltip("Assign your background music tracks here. A random one will play automatically.")]
    [SerializeField] private AudioClip[] bgMusicClips;
    [SerializeField] private AudioClip correctAnswerClip;
    [SerializeField] private AudioClip wrongAnswerClip;
    [SerializeField] private AudioClip levelCompleteClip;

    [Header("9. Completion Animations")]
    [Tooltip("Assign the Coin Text objects from ALL panels here")]
    public TextMeshProUGUI[] CoinsTxts;
    public GameObject coinsAnimation;
    public GameObject[] celebrationStars;

    [Header("10. Top Bar & Title UI")]
    [Tooltip("Assign the '1/9 Lesson' texts from ALL panels here")]
    [SerializeField] private TextMeshProUGUI[] topProgressBarTexts;
    [Tooltip("Assign the filled Image components of the top progress bars from ALL panels here")]
    [SerializeField] private Image[] topProgressBarFills;
    [Tooltip("Assign the text that says 'Level 1 - Lesson 1' from ALL panels here")]
    [SerializeField] private TextMeshProUGUI[] levelLessonTitleTexts;

    [Header("Quiz Feedback Colors")]
    [SerializeField] private Color defaultButtonColor = Color.white;
    [SerializeField] private Color correctColor = Color.green;
    [SerializeField] private Color incorrectColor = Color.red;

    // Data tracking
    private LessonData _currentLesson;

    // Tracking current level location to save progress
    private string _currentWorldId;
    private string _currentLevelId;
    private int _currentLessonIndex;

    // Learning Phase State
    private LearningItemsData _learningItemsData;
    private List<LearningItem> _learningItems = new List<LearningItem>();
    private readonly List<GameObject> _spawnedLearningCells = new List<GameObject>();
    private readonly HashSet<string> _requiredAudioCells = new HashSet<string>();
    private readonly HashSet<string> _playedAudioCells = new HashSet<string>();
    private int _learningIndex = 0;

    // Quiz Phase State
    private List<QuizItem> _quizzes;
    private int _quizIndex = 0;
    private bool _isProcessingAnswer = false;

    // Global Stats Tracking
    private int _correctAnswers = 0;
    private int _wrongAnswers = 0;
    private int _totalQuestions = 0;

    // Speech Compare State
    private string micName;
    private bool isRecording = false;
    private bool permissionGranted = false;
    private AudioClip recordedClip;

    // Audio Toggles State
    private bool _isMusicMuted = false;
    private bool _isSfxMuted = false;

    // Runtime world-button sprites created from downloaded Cloudflare images.
    private readonly List<Sprite> _downloadedWorldButtonSprites = new List<Sprite>();

    private void Awake()
    {
        if (Instance == null) Instance = this;
        else
        {
            Destroy(gameObject);
            return;
        }

        LoadAudioSettings();
        ApplyDefaultWorldButtonSprites();
        StartCoroutine(LoadWorldButtonImagesFromFirebase());
        RequestMicrophonePermission();
        PlayBackgroundMusic();
    }

    // ================= WORLD BUTTON IMAGES =================

    private IEnumerator LoadWorldButtonImagesFromFirebase()
    {
        if (string.IsNullOrWhiteSpace(firebaseAppStateUrl))
        {
            Debug.LogWarning("Firebase App State URL is empty.");
            yield break;
        }

        using (UnityWebRequest request = UnityWebRequest.Get(firebaseAppStateUrl))
        {
            yield return request.SendWebRequest();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError(
                    $"Could not load world data from Firebase: {request.error} " +
                    $"({request.responseCode})"
                );
                yield break;
            }

            AppState appState;

            try
            {
                appState = JsonConvert.DeserializeObject<AppState>(
                    request.downloadHandler.text
                );
            }
            catch (System.Exception exception)
            {
                Debug.LogError(
                    $"Could not parse Firebase appState JSON: {exception.Message}"
                );
                yield break;
            }

            if (appState == null)
            {
                Debug.LogError("Firebase returned an empty appState object.");
                yield break;
            }

            ApplyWorldButtonImages(appState);
        }
    }

    private void ApplyDefaultWorldButtonSprites()
    {
        if (worldButtonImages == null || defaultWorldButtonSprites == null)
            return;

        int count = Mathf.Min(worldButtonImages.Length, defaultWorldButtonSprites.Length);

        for (int i = 0; i < count; i++)
        {
            if (worldButtonImages[i] == null || defaultWorldButtonSprites[i] == null)
                continue;

            worldButtonImages[i].sprite = defaultWorldButtonSprites[i];
            worldButtonImages[i].preserveAspect = true;
        }
    }

    /// <summary>
    /// Call this after Firebase JSON has been deserialized.
    /// Worlds are matched to the Inspector array using their Firebase order value.
    /// </summary>
    public void ApplyWorldButtonImages(AppState appState)
    {
        if (appState == null || appState.Worlds == null)
        {
            Debug.LogWarning("Cannot apply world images because appState.worlds is missing.");
            return;
        }

        // Restore the Inspector fallbacks while new remote images load.
        ApplyDefaultWorldButtonSprites();
        ClearDownloadedWorldButtonSprites();

        List<WorldData> orderedWorlds = appState.Worlds
            .Where(entry => entry.Value != null)
            .OrderBy(entry => entry.Value.Order)
            .ThenBy(entry => entry.Key)
            .Select(entry => entry.Value)
            .ToList();

        StartCoroutine(DownloadWorldButtonImages(orderedWorlds));
    }

    private IEnumerator DownloadWorldButtonImages(List<WorldData> orderedWorlds)
    {
        if (worldButtonImages == null || worldButtonImages.Length == 0)
        {
            Debug.LogWarning("No World Button Images are assigned in LessonGameFlow.");
            yield break;
        }

        int count = Mathf.Min(worldButtonImages.Length, orderedWorlds.Count);

        for (int i = 0; i < count; i++)
        {
            Image targetImage = worldButtonImages[i];
            string imageUrl = orderedWorlds[i].ButtonImageUrl;

            if (targetImage == null || string.IsNullOrWhiteSpace(imageUrl))
                continue;

            using (UnityWebRequest request = UnityWebRequestTexture.GetTexture(imageUrl))
            {
                yield return request.SendWebRequest();

                if (request.result != UnityWebRequest.Result.Success)
                {
                    Debug.LogWarning(
                        $"Could not download world button image {i + 1}: {request.error}"
                    );
                    continue;
                }

                Texture2D texture = DownloadHandlerTexture.GetContent(request);

                if (texture == null)
                    continue;

                Sprite downloadedSprite = Sprite.Create(
                    texture,
                    new Rect(0f, 0f, texture.width, texture.height),
                    new Vector2(0.5f, 0.5f),
                    100f
                );

                downloadedSprite.name = $"WorldButton_{i + 1}_Downloaded";
                _downloadedWorldButtonSprites.Add(downloadedSprite);

                targetImage.sprite = downloadedSprite;
                targetImage.preserveAspect = true;

                Debug.Log($"Applied uploaded image to world button {i + 1}: {imageUrl}");
            }
        }
    }

    private void ClearDownloadedWorldButtonSprites()
    {
        foreach (Sprite downloadedSprite in _downloadedWorldButtonSprites)
        {
            if (downloadedSprite == null)
                continue;

            if (downloadedSprite.texture != null)
                Destroy(downloadedSprite.texture);

            Destroy(downloadedSprite);
        }

        _downloadedWorldButtonSprites.Clear();
    }

    private void OnDestroy()
    {
        ClearDownloadedWorldButtonSprites();

        if (Instance == this)
            Instance = null;
    }

    private void Update()
    {
        if (isRecording && scMicLevelBar != null)
        {
            float level = GetMicLevel();
            float scale = Mathf.Lerp(0.5f, 2.5f, level * 10f);
            scMicLevelBar.transform.localScale = new Vector3(scale, scale, scale);
        }
    }

    // ================= AUDIO TOGGLES =================

    private void LoadAudioSettings()
    {
        _isMusicMuted = PlayerPrefs.GetInt("MusicMuted", 0) == 1;
        _isSfxMuted = PlayerPrefs.GetInt("SfxMuted", 0) == 1;

        if (bgmSource != null) bgmSource.mute = _isMusicMuted;
        if (sfxSource != null) sfxSource.mute = _isSfxMuted;
        if (lessonAudioSource != null) lessonAudioSource.mute = _isSfxMuted;
    }

    public void ToggleMusic()
    {
        _isMusicMuted = !_isMusicMuted;
        PlayerPrefs.SetInt("MusicMuted", _isMusicMuted ? 1 : 0);
        PlayerPrefs.Save();

        if (bgmSource != null) bgmSource.mute = _isMusicMuted;
    }

    public void ToggleSFX()
    {
        _isSfxMuted = !_isSfxMuted;
        PlayerPrefs.SetInt("SfxMuted", _isSfxMuted ? 1 : 0);
        PlayerPrefs.Save();

        if (sfxSource != null) sfxSource.mute = _isSfxMuted;
        if (lessonAudioSource != null) lessonAudioSource.mute = _isSfxMuted;
    }

    // ================= PERMISSIONS =================

    private void RequestMicrophonePermission()
    {
#if UNITY_ANDROID
        if (!Permission.HasUserAuthorizedPermission(Permission.Microphone))
        {
            Permission.RequestUserPermission(Permission.Microphone);
            StartCoroutine(WaitForPermission());
            return;
        }
#elif UNITY_IOS
        if (!Application.HasUserAuthorization(UserAuthorization.Microphone))
        {
            Application.RequestUserAuthorization(UserAuthorization.Microphone);
            StartCoroutine(WaitForPermission());
            return;
        }
#endif
        permissionGranted = true;
        InitMicrophone();
    }

    private IEnumerator WaitForPermission()
    {
        yield return new WaitForSecondsRealtime(0.2f);
#if UNITY_ANDROID
        while (!Permission.HasUserAuthorizedPermission(Permission.Microphone)) yield return null;
#elif UNITY_IOS
        while (!Application.HasUserAuthorization(UserAuthorization.Microphone)) yield return null;
#endif
        permissionGranted = true;
        InitMicrophone();
    }

    private void InitMicrophone()
    {
        if (Microphone.devices.Length > 0)
        {
            micName = Microphone.devices[0];
            Debug.Log("Mic Found: " + micName);
        }
        else
        {
            Debug.LogError("No microphone detected!");
        }
    }

    // ================= SETUP =================

    public void StartLesson(LessonData lessonData, string worldId, string levelId, int lessonIndex)
    {
        StopBackgroundMusic();

        _currentLesson = lessonData;
        _currentWorldId = worldId;
        _currentLevelId = levelId;
        _currentLessonIndex = lessonIndex;

        _learningIndex = 0;
        _quizIndex = 0;
        _correctAnswers = 0;
        _wrongAnswers = 0;

        // --- Set Title Text on ALL Panels ---
        if (levelLessonTitleTexts != null)
        {
            int cleanLevelNum = PlayerPrefs.GetInt("CurrentLvl", 1);
            string titleString = $"Level {cleanLevelNum} - Lesson {lessonIndex + 1}";

            foreach (var txt in levelLessonTitleTexts)
            {
                if (txt != null) txt.text = titleString;
            }
        }

        // --- Set Top Progress Bar ---
        if (topProgressBarTexts != null)
        {
            string progressStr = $"{lessonIndex + 1}/9 Lesson";
            foreach (var txt in topProgressBarTexts)
            {
                if (txt != null) txt.text = progressStr;
            }
        }

        if (topProgressBarFills != null)
        {
            float fillVal = (float)(lessonIndex + 1) / 9f;
            foreach (var fill in topProgressBarFills)
            {
                if (fill != null) fill.fillAmount = fillVal;
            }
        }

        if (lessonData.Data != null && lessonData.Data.LearningItems != null)
        {
            _learningItemsData = lessonData.Data.LearningItems;
            _learningItems = _learningItemsData.Items != null
                ? _learningItemsData.Items
                    .OrderBy(entry => entry.Key)
                    .Select(entry => entry.Value)
                    .Where(item => item != null)
                    .ToList()
                : new List<LearningItem>();

            if (learningNameText != null)
                learningNameText.text = _learningItemsData.Name ?? string.Empty;

            if (learningDescriptionText != null)
                learningDescriptionText.text = _learningItemsData.Description ?? string.Empty;
        }
        else
        {
            _learningItemsData = null;
            _learningItems = new List<LearningItem>();

            if (learningNameText != null) learningNameText.text = string.Empty;
            if (learningDescriptionText != null) learningDescriptionText.text = string.Empty;
        }

        if (lessonData.Data != null && lessonData.Data.Quizzes != null)
        {
            _quizzes = lessonData.Data.Quizzes
                .OrderBy(q => GetQuizTypePriority(q.Value.Type))
                .ThenBy(q => q.Key)
                .Select(q => q.Value)
                .ToList();
        }
        else
            _quizzes = new List<QuizItem>();

        _totalQuestions = _quizzes.Count;

        // Update all coin texts on start
        UpdateCoinsUI();

        if (coinsAnimation != null) coinsAnimation.SetActive(false);
        if (celebrationStars != null)
        {
            foreach (var star in celebrationStars) star.SetActive(false);
        }

        if (lessonSelectionMenu != null) lessonSelectionMenu.SetActive(false);
        if (textMultipleChoicePanel != null) textMultipleChoicePanel.SetActive(false);
        if (audioMultipleChoicePanel != null) audioMultipleChoicePanel.SetActive(false);
        if (audioTypingPanel != null) audioTypingPanel.SetActive(false);
        if (speechComparePanel != null) speechComparePanel.SetActive(false);

        if (_learningItems.Count > 0)
        {
            if (learningPanel != null) learningPanel.SetActive(true);
            LoadCurrentLearningItem();
        }
        else
        {
            if (learningPanel != null) learningPanel.SetActive(false);
            StartQuizzes();
        }
    }

    private int GetQuizTypePriority(string quizType)
    {
        switch (quizType)
        {
            case "text_multiple_choice": return 1;
            case "audio_multiple_choice": return 2;
            case "audio_typing": return 3;
            case "arabic_voice_record": return 4;
            default: return 99;
        }
    }

    // ================= LEARNING PHASE =================

    private void LoadCurrentLearningItem()
    {
        if (_learningIndex < 0 || _learningIndex >= _learningItems.Count)
            return;

        ClearLearningGrid();
        UpdateStatsUI(0);

        if (_learningItemsData == null)
            return;

        ConfigureLearningGrid(_learningItemsData.GridSize);

        LearningItem currentItem = _learningItems[_learningIndex];
        if (currentItem.Cells == null)
        {
            UpdateLearningNextButton();
            return;
        }

        List<KeyValuePair<string, LearningCell>> orderedCells = currentItem.Cells
            .Where(entry => entry.Value != null)
            .OrderBy(entry => entry.Value.Row)
            .ThenBy(entry => entry.Value.Column)
            .ToList();

        foreach (KeyValuePair<string, LearningCell> entry in orderedCells)
        {
            string cellId = entry.Key;
            LearningCell cell = entry.Value;
            bool hasAudio = !string.IsNullOrWhiteSpace(cell.AudioUrl);

            if (hasAudio)
                _requiredAudioCells.Add(cellId);

            GameObject cellObject = Instantiate(learningCellPrefab, learningGridContent);
            _spawnedLearningCells.Add(cellObject);
            ConfigureLearningCell(cellObject, cellId, cell);
        }

        UpdateLearningNextButton();
        LayoutRebuilder.ForceRebuildLayoutImmediate(learningGridContent);
    }

    private void ConfigureLearningGrid(LearningGridSize gridSize)
    {
        if (learningGridLayout == null)
            return;

        int columns = gridSize != null
            ? Mathf.Clamp(gridSize.Columns, 1, 2)
            : 1;

        learningGridLayout.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
        learningGridLayout.constraintCount = columns;
        learningGridLayout.startAxis = GridLayoutGroup.Axis.Horizontal;
        learningGridLayout.startCorner = GridLayoutGroup.Corner.UpperLeft;
    }

    private void OnLearningCellAudioPressed(string cellId, string audioUrl)
    {
        if (string.IsNullOrWhiteSpace(audioUrl))
        {
            Debug.LogWarning($"No learning audio URL for cell '{cellId}'.");
            return;
        }

        Debug.Log($"Playing learning audio for '{cellId}': {audioUrl}");
        PlayRemoteVoiceover(audioUrl);
        _playedAudioCells.Add(cellId);
        UpdateLearningNextButton();
    }

    private void ConfigureLearningCell(GameObject cellObject, string cellId, LearningCell cell)
    {
        Transform textTransform = FindDescendantByName(
            cellObject.transform,
            cellTextObjectName
        );

        TextMeshProUGUI cellText = textTransform != null
            ? textTransform.GetComponent<TextMeshProUGUI>()
            : null;

        if (cellText != null)
        {
            cellText.text = cell.Text ?? string.Empty;
            cellText.isRightToLeftText = string.Equals(
                cell.Language,
                "arabic",
                System.StringComparison.OrdinalIgnoreCase
            );
            cellText.alignment = TextAlignmentOptions.Center;
        }
        else
        {
            Debug.LogWarning(
                $"Learning prefab is missing TextMeshProUGUI child '{cellTextObjectName}'."
            );
        }

        Transform buttonTransform = FindDescendantByName(
            cellObject.transform,
            cellAudioButtonObjectName
        );

        Button audioButton = buttonTransform != null
            ? buttonTransform.GetComponent<Button>()
            : null;

        // The learning prefab has only one Button, so this also handles an
        // older serialized child name such as "LetterButton" in the Inspector.
        if (audioButton == null)
            audioButton = cellObject.GetComponentInChildren<Button>(true);

        bool hasAudio = !string.IsNullOrWhiteSpace(cell.AudioUrl);

        if (audioButton != null)
        {
            audioButton.onClick.RemoveAllListeners();
            audioButton.gameObject.SetActive(hasAudio);

            if (hasAudio)
            {
                string audioUrl = cell.AudioUrl;
                audioButton.onClick.AddListener(
                    () => OnLearningCellAudioPressed(cellId, audioUrl)
                );
            }
        }
        else
        {
            Debug.LogWarning(
                $"Learning prefab is missing Button child '{cellAudioButtonObjectName}'."
            );
        }
    }

    private Transform FindDescendantByName(Transform parent, string objectName)
    {
        if (parent.name == objectName)
            return parent;

        foreach (Transform child in parent)
        {
            Transform result = FindDescendantByName(child, objectName);
            if (result != null)
                return result;
        }

        return null;
    }

    private void UpdateLearningNextButton()
    {
        if (learningNextButton == null)
            return;

        learningNextButton.interactable =
            _requiredAudioCells.Count == 0 ||
            _playedAudioCells.Count >= _requiredAudioCells.Count;
    }

    private void ClearLearningGrid()
    {
        foreach (GameObject cellObject in _spawnedLearningCells)
        {
            if (cellObject == null)
                continue;

            cellObject.SetActive(false);
            Destroy(cellObject);
        }

        _spawnedLearningCells.Clear();
        _requiredAudioCells.Clear();
        _playedAudioCells.Clear();
    }

    public void NextLearningItem()
    {
        _learningIndex++;

        if (_learningIndex < _learningItems.Count)
        {
            LoadCurrentLearningItem();
        }
        else
        {
            ClearLearningGrid();

            if (learningPanel != null)
                learningPanel.SetActive(false);

            StartQuizzes();
        }
    }

    // ================= QUIZ PHASE (Includes Speech!) =================

    private void StartQuizzes()
    {
        if (_quizzes.Count == 0)
        {
            FinishLesson();
            return;
        }
        LoadCurrentQuiz();
    }

    private void LoadCurrentQuiz()
    {
        if (textMultipleChoicePanel != null) textMultipleChoicePanel.SetActive(false);
        if (audioMultipleChoicePanel != null) audioMultipleChoicePanel.SetActive(false);
        if (audioTypingPanel != null) audioTypingPanel.SetActive(false);
        if (speechComparePanel != null) speechComparePanel.SetActive(false);

        _isProcessingAnswer = false;
        ResetQuizUIColors();

        UpdateStatsUI(_quizIndex + 1);

        QuizItem currentQuiz = _quizzes[_quizIndex];

        List<KeyValuePair<string, QuizOption>> optionsList = null;
        if (currentQuiz.Options != null)
        {
            optionsList = currentQuiz.Options.OrderBy(o => o.Key).ToList();
        }

        switch (currentQuiz.Type)
        {
            case "text_multiple_choice":
                SetupTextMultipleChoice(currentQuiz, optionsList);
                break;
            case "audio_multiple_choice":
                SetupAudioMultipleChoice(currentQuiz, optionsList);
                break;
            case "audio_typing":
                SetupAudioTyping(currentQuiz);
                break;
            case "arabic_voice_record":
                SetupSpeechCompare(currentQuiz);
                break;
            default:
                NextQuiz();
                break;
        }
    }

    private void SetupTextMultipleChoice(QuizItem quiz, List<KeyValuePair<string, QuizOption>> options)
    {
        if (textMultipleChoicePanel != null) textMultipleChoicePanel.SetActive(true);
        if (tmcQuestionText != null) tmcQuestionText.text = quiz.QuestionText;

        for (int i = 0; i < tmcOptionButtons.Length; i++)
        {
            int index = i;
            Button currentButton = tmcOptionButtons[index];

            if (index < options.Count)
            {
                currentButton.gameObject.SetActive(true);
                tmcOptionTexts[index].text = options[index].Value.Text;

                string optionId = options[index].Key;
                currentButton.onClick.RemoveAllListeners();
                currentButton.onClick.AddListener(() => CheckMultipleChoiceAnswer(optionId, quiz.CorrectOptionId, currentButton));
            }
            else currentButton.gameObject.SetActive(false);
        }
    }

    private void SetupAudioMultipleChoice(QuizItem quiz, List<KeyValuePair<string, QuizOption>> options)
    {
        if (audioMultipleChoicePanel != null) audioMultipleChoicePanel.SetActive(true);

        amcPlayAudioButton.onClick.RemoveAllListeners();
        amcPlayAudioButton.onClick.AddListener(() => PlayRemoteVoiceover(quiz.QuestionAudioUrl));

        for (int i = 0; i < amcOptionButtons.Length; i++)
        {
            int index = i;
            Button currentButton = amcOptionButtons[index];

            if (index < options.Count)
            {
                currentButton.gameObject.SetActive(true);
                amcOptionTexts[index].text = options[index].Value.Text;

                string optionId = options[index].Key;
                currentButton.onClick.RemoveAllListeners();
                currentButton.onClick.AddListener(() => CheckMultipleChoiceAnswer(optionId, quiz.CorrectOptionId, currentButton));
            }
            else currentButton.gameObject.SetActive(false);
        }
    }

    private void SetupAudioTyping(QuizItem quiz)
    {
        if (audioTypingPanel != null) audioTypingPanel.SetActive(true);
        atInputField.text = "";

        atPlayAudioButton.onClick.RemoveAllListeners();
        atPlayAudioButton.onClick.AddListener(() => PlayRemoteVoiceover(quiz.QuestionAudioUrl));

        atSubmitButton.onClick.RemoveAllListeners();
        atSubmitButton.onClick.AddListener(() => CheckTypingAnswer(atInputField.text, quiz.CorrectAnswerText));
    }

    private void SetupSpeechCompare(QuizItem quiz)
    {
        if (speechComparePanel != null) speechComparePanel.SetActive(true);

        recordedClip = null;

        if (scWordText != null)
        {
            scWordText.text = quiz.EnglishPromptText;
        }

        if (scMicLevelBar != null) scMicLevelBar.gameObject.SetActive(false);

        scPlayUserButton.gameObject.SetActive(false);
        scSubmitButton.gameObject.SetActive(false);

        EventTrigger et = scRecordButton.GetComponent<EventTrigger>();
        if (et == null) et = scRecordButton.gameObject.AddComponent<EventTrigger>();
        et.triggers.Clear();

        EventTrigger.Entry pressEntry = new EventTrigger.Entry();
        pressEntry.eventID = EventTriggerType.PointerDown;
        pressEntry.callback.AddListener((data) => { StartRecording(); });
        et.triggers.Add(pressEntry);

        EventTrigger.Entry releaseEntry = new EventTrigger.Entry();
        releaseEntry.eventID = EventTriggerType.PointerUp;
        releaseEntry.callback.AddListener((data) => { StopRecording(); });
        et.triggers.Add(releaseEntry);

        EventTrigger.Entry exitEntry = new EventTrigger.Entry();
        exitEntry.eventID = EventTriggerType.PointerExit;
        exitEntry.callback.AddListener((data) => { if (isRecording) StopRecording(); });
        et.triggers.Add(exitEntry);

        scPlayUserButton.onClick.RemoveAllListeners();
        scPlayUserButton.onClick.AddListener(PlayUserRecording);

        scSubmitButton.onClick.RemoveAllListeners();
        scSubmitButton.onClick.AddListener(() =>
        {
            if (_isProcessingAnswer) return;
            StartCoroutine(HandleSpeechResult());
        });
    }

    private IEnumerator HandleSpeechResult()
    {
        _isProcessingAnswer = true;
        _correctAnswers++;
        PlaySFX(correctAnswerClip);

        yield return new WaitForSeconds(1f);

        _isProcessingAnswer = false;
        NextQuiz();
    }

    private void CheckMultipleChoiceAnswer(string selectedId, string correctId, Button clickedButton)
    {
        if (_isProcessingAnswer) return;
        bool isCorrect = (selectedId == correctId);
        StartCoroutine(HandleAnswerResult(clickedButton, isCorrect));
    }

    private IEnumerator HandleAnswerResult(Button clickedButton, bool isCorrect)
    {
        _isProcessingAnswer = true;
        if (clickedButton != null) clickedButton.image.color = isCorrect ? correctColor : incorrectColor;

        if (isCorrect)
        {
            _correctAnswers++;
            PlaySFX(correctAnswerClip);
        }
        else
        {
            _wrongAnswers++;
            PlaySFX(wrongAnswerClip);
        }

        yield return new WaitForSeconds(1f);

        if (isCorrect) NextQuiz();
        else
        {
            if (clickedButton != null) clickedButton.image.color = defaultButtonColor;
            _isProcessingAnswer = false;
        }
    }

    private void CheckTypingAnswer(string typedText, string correctAnswer)
    {
        if (_isProcessingAnswer) return;
        bool isCorrect = typedText.Trim().Equals(correctAnswer.Trim(), System.StringComparison.OrdinalIgnoreCase);
        StartCoroutine(HandleTypingResult(isCorrect));
    }

    private IEnumerator HandleTypingResult(bool isCorrect)
    {
        _isProcessingAnswer = true;
        atSubmitButton.image.color = isCorrect ? correctColor : incorrectColor;

        if (isCorrect)
        {
            _correctAnswers++;
            PlaySFX(correctAnswerClip);
        }
        else
        {
            _wrongAnswers++;
            PlaySFX(wrongAnswerClip);
        }

        yield return new WaitForSeconds(1f);

        if (isCorrect) NextQuiz();
        else
        {
            atSubmitButton.image.color = defaultButtonColor;
            _isProcessingAnswer = false;
        }
    }

    private void ResetQuizUIColors()
    {
        foreach (var btn in tmcOptionButtons) btn.image.color = defaultButtonColor;
        foreach (var btn in amcOptionButtons) btn.image.color = defaultButtonColor;
        atSubmitButton.image.color = defaultButtonColor;
    }

    private void NextQuiz()
    {
        _quizIndex++;
        if (_quizIndex < _quizzes.Count)
            LoadCurrentQuiz();
        else
            FinishLesson();
    }

    // ================= SPEECH MICROPHONE LOGIC =================

    private void StartRecording()
    {
        if (!permissionGranted || string.IsNullOrEmpty(micName)) return;
        if (isRecording) return;

        recordedClip = Microphone.Start(micName, false, 10, 44100);
        isRecording = true;

        if (scMicLevelBar != null) scMicLevelBar.gameObject.SetActive(true);
    }

    private void StopRecording()
    {
        if (!isRecording) return;
        Microphone.End(micName);
        isRecording = false;

        if (scMicLevelBar != null) scMicLevelBar.gameObject.SetActive(false);

        scPlayUserButton.gameObject.SetActive(true);
        scSubmitButton.gameObject.SetActive(false);
    }

    private void PlayUserRecording()
    {
        if (recordedClip == null || lessonAudioSource == null) return;
        lessonAudioSource.clip = recordedClip;
        lessonAudioSource.Play();

        scSubmitButton.gameObject.SetActive(true);
    }

    private float GetMicLevel()
    {
        if (recordedClip == null || string.IsNullOrEmpty(micName)) return 0;

        int sampleWindow = 128;
        float[] samples = new float[sampleWindow];
        int micPosition = Microphone.GetPosition(micName) - sampleWindow + 1;

        if (micPosition < 0) return 0;
        recordedClip.GetData(samples, micPosition);

        float level = 0;
        foreach (float sample in samples)
        {
            float wavePeak = Mathf.Abs(sample);
            if (wavePeak > level) level = wavePeak;
        }
        return level;
    }

    // ================= SHARED UI & AUDIO MANAGEMENT =================

    private void UpdateStatsUI(int currentQuestionNumber)
    {
        if (_totalQuestions == 0) _totalQuestions = 1;
        if (currentQuestionNumber > _totalQuestions) currentQuestionNumber = _totalQuestions;

        string correctString = _correctAnswers.ToString();
        string wrongString = _wrongAnswers.ToString();

        if (questionCounterTexts != null)
        {
            string progressString = $"{currentQuestionNumber}/{_totalQuestions}";
            foreach (var txt in questionCounterTexts) { if (txt != null) txt.text = progressString; }
        }

        if (correctAnswerTexts != null)
        {
            foreach (var txt in correctAnswerTexts) { if (txt != null) txt.text = correctString; }
        }

        if (wrongAnswerTexts != null)
        {
            foreach (var txt in wrongAnswerTexts) { if (txt != null) txt.text = wrongString; }
        }
    }

    // Updates all coin texts across the UI panels dynamically
    private void UpdateCoinsUI()
    {
        if (CoinsTxts != null)
        {
            int currentCoins = PlayerPrefs.GetInt("TotalCoins", 0);
            foreach (var txt in CoinsTxts)
            {
                if (txt != null) txt.text = currentCoins.ToString();
            }
        }
    }

    private void PlayRemoteVoiceover(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            Debug.LogWarning("Cannot play remote audio because its URL is empty.");
            return;
        }

        if (AudioHelper.Instance == null)
        {
            Debug.LogError("AudioHelper.Instance is missing from the scene.");
            return;
        }

        AudioHelper.Instance.PlayAudioFromUrl(url);
    }

    private void PlayBackgroundMusic()
    {
        if (bgmSource != null && bgMusicClips != null && bgMusicClips.Length > 0 && !_isMusicMuted)
        {
            int randomIndex = Random.Range(0, bgMusicClips.Length);
            bgmSource.clip = bgMusicClips[randomIndex];
            bgmSource.loop = true;
            bgmSource.Play();
        }
    }

    private void StopBackgroundMusic()
    {
        if (bgmSource != null && bgmSource.isPlaying)
        {
            bgmSource.Stop();
        }
    }

    private void PlaySFX(AudioClip clip)
    {
        if (sfxSource != null && clip != null && !_isSfxMuted)
        {
            sfxSource.PlayOneShot(clip);
        }
    }

    // ================= COMPLETION SEQUENCE =================

    private void FinishLesson()
    {
        Debug.Log("Lesson completely finished! Checking for unlock...");

        string saveKey = $"HighestUnlockedLesson_{_currentWorldId}_{_currentLevelId}";
        int highestUnlocked = PlayerPrefs.GetInt(saveKey, 0);

        if (_currentLessonIndex == highestUnlocked)
        {
            PlayerPrefs.SetInt(saveKey, highestUnlocked + 1);
            PlayerPrefs.SetInt("TotalCoins", PlayerPrefs.GetInt("TotalCoins", 0) + 10);

            if (LeaderboardManager.instance != null)
            {
                LeaderboardManager.instance.AddTestScore(PlayerPrefs.GetInt("TotalCoins"));
            }
            Debug.Log($"✅ UNLOCKED: New highest = {highestUnlocked + 1}");
        }
        else
        {
            PlayerPrefs.SetInt("TotalCoins", PlayerPrefs.GetInt("TotalCoins", 0) + 10);
            Debug.Log($"ℹ️ Replay — no unlock. Next to finish: {highestUnlocked}");
        }

        PlayerPrefs.Save();

        // Update local arrays and master UI controller
        UpdateCoinsUI();
        if (UIController.Instance != null) UIController.Instance.UpdateCoins();

        StartCoroutine(LessonCompletionSequence());
    }

    private IEnumerator LessonCompletionSequence()
    {
        if (textMultipleChoicePanel != null) textMultipleChoicePanel.SetActive(false);
        if (audioMultipleChoicePanel != null) audioMultipleChoicePanel.SetActive(false);
        if (audioTypingPanel != null) audioTypingPanel.SetActive(false);
        if (learningPanel != null) learningPanel.SetActive(false);

        if (celebrationStars != null)
        {
            foreach (var star in celebrationStars) star.SetActive(false);
        }

        if (coinsAnimation != null) coinsAnimation.SetActive(true);

        yield return new WaitForSeconds(2f);

        PlaySFX(levelCompleteClip);

        if (celebrationStars != null && celebrationStars.Length > 0)
        {
            int i = Random.Range(0, celebrationStars.Length);
            celebrationStars[i].SetActive(true);
        }

        yield return new WaitForSeconds(3.5f);

        if (speechComparePanel != null) speechComparePanel.SetActive(false);

        if (UIController.Instance != null) UIController.Instance.UpdateCounters();

        if (coinsAnimation != null) coinsAnimation.SetActive(false);
        if (celebrationStars != null)
        {
            foreach (var star in celebrationStars) star.SetActive(false);
        }

        if (lessonSelectionMenu != null) lessonSelectionMenu.SetActive(true);

        if (LessonSelectionUI.Instance != null)
        {
            LessonSelectionUI.Instance.OpenLessonsForLevel(_currentWorldId, _currentLevelId);
        }

        PlayBackgroundMusic();
    }

    // ================= QUIT & SHARE & RESTART =================

    public void Share()
    {
        string gameLink = "https://play.google.com/store/apps/details?id=com.yourcompany.yourgame";
        string message = "Check out my game!\n" + gameLink;

#if UNITY_ANDROID
        AndroidJavaClass intentClass = new AndroidJavaClass("android.content.Intent");
        AndroidJavaObject intentObject = new AndroidJavaObject("android.content.Intent");

        intentObject.Call<AndroidJavaObject>("setAction", intentClass.GetStatic<string>("ACTION_SEND"));
        intentObject.Call<AndroidJavaObject>("setType", "text/plain");
        intentObject.Call<AndroidJavaObject>("putExtra", intentClass.GetStatic<string>("EXTRA_TEXT"), message);

        AndroidJavaClass unity = new AndroidJavaClass("com.unity3d.player.UnityPlayer");
        AndroidJavaObject currentActivity = unity.GetStatic<AndroidJavaObject>("currentActivity");

        AndroidJavaObject chooser = intentClass.CallStatic<AndroidJavaObject>("createChooser", intentObject, "Share Game");
        currentActivity.Call("startActivity", chooser);
#endif

#if UNITY_IOS
        Handheld.ShareURL(gameLink);
#endif
    }

    public void QuitLesson()
    {
        Debug.Log("Player exited the lesson early.");

        if (learningPanel != null) learningPanel.SetActive(false);
        if (textMultipleChoicePanel != null) textMultipleChoicePanel.SetActive(false);
        if (audioMultipleChoicePanel != null) audioMultipleChoicePanel.SetActive(false);
        if (audioTypingPanel != null) audioTypingPanel.SetActive(false);
        if (speechComparePanel != null) speechComparePanel.SetActive(false);

        if (lessonAudioSource != null && lessonAudioSource.isPlaying)
        {
            lessonAudioSource.Stop();
        }

        if (lessonSelectionMenu != null) lessonSelectionMenu.SetActive(true);

        PlayBackgroundMusic();
    }

    public void RestartLesson()
    {
        Debug.Log("Restarting the current lesson...");

        if (lessonAudioSource != null && lessonAudioSource.isPlaying)
        {
            lessonAudioSource.Stop();
        }

        if (_currentLesson != null)
        {
            StartLesson(_currentLesson, _currentWorldId, _currentLevelId, _currentLessonIndex);
        }
        else
        {
            Debug.LogWarning("Cannot restart: No lesson data is currently loaded.");
        }
    }
}
